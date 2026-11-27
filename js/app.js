const { createApp } = Vue;


createApp({

    // ---------------------------
    // Data: the variables the page uses. When they change, Vue
    // automatically updates the HTML
    // --------------

    data() {
        return {
            siteName: 'AfterSchool Connect',

            apiUrl: 'https://m01146275-after-school-express.onrender.com',

            lessons: [],         // all lessons from GET /lessons
            teachers: [],        // all teachers from GET /teachers
            cart: [],            // one entry for every space added to the cart
            showCart: false,     // false = lessons page, true = cart page

            sortBy: 'topic',      // which attribute to sort by
            sortOrder: 'asc',     // 'asc' or 'desc'
            selectedTeacher: '',   // '' means show all teachers

            name: '',              // checkout form
            phone: '',
            orderMessage: '',      // message shown after checkout

            searchTerm: '',         // [Challenge: Search] text typed in the search box
            searchIds: null,        // ids of lessons the server found (null = no search)
            enrolments: {}          // [Challenge: Enrolment] lessonId -> number of spaces booked
        };
    },

    // -------------------------------------------
    // Computed: values worked out from the date. They re-calculate automatically whenever the data they use changes.
    // -------------------------------------------
    computed: {

        // [Challenge: Search] Only keep lessons the server returned for the search
        searchedLessons() {
            if (this.searchIds === null) {
                return this.lessons; // nothing typed, show everything
            }
            return this.lessons.filter(lesson => this.searchIds.includes(lesson._id));
        },

        // [Challenge: Teachers] Only keep the lessons taught by the chosen teacher
        filteredLessons() {
            if (this.selectedTeacher === '') {
                return this.searchedLessons; // no teacher chosen, show everything (after search)
            }
            // find the chosen teacher, then keep lessons whose _id is in their lessonsIds list
            const teacher = this.teachers.find(t => t._id === this.selectedTeacher);
            return this.searchedLessons.filter(lesson => teacher.lessonIds.includes(lesson._id));
        },

        // Sort the lessons by the chosen attribute and order
        sortedLessons() {
            // slice() makes a copy so we do not change the originslarray order
            return this.filteredLessons.slice().sort((a, b) => {
                let result = 0;
                if (a[this.sortBy] > b[this.sortBy]) result = 1;
                if (a[this.sortBy] < b[this.sortBy]) result = -1;
                // flip the result for descending order
                return this.sortOrder === 'asc' ? result : -result;
            });
        },

        // Name must be letters ( and spaces) only - checked with a regular expression
        isNameValid() {
            return /^[A-Za-z\s]+$/.test(this.name);
        },

        // Phone must be numbers only
        isPhoneValid() {
            return /^[0-9]+$/.test(this.phone);
        },

        // Checkout button is enabled only when everything is valid
        canCheckout() {
            return this.isNameValid && this.isPhoneValid && this.cart.length > 0;
        },

        // Total price of everything in the cart
        cartTotal() {
            let total = 0;
            this.cart.forEach(item => { total += item.price; });
            return total;
        }
    },

    // ---------------------------------------------
    // METHODS: functions called by buttons (@click) in the HTML
    // ---------------------------------------------
    methods: {

        // Switch between the lessons page and the cart page
        toggleCart() {
            this.showCart = !this.showCart;
            this.orderMessage = '';
        },

        // Add one space of a lesson to the cart
        addToCart(lesson) {
            if (lesson.space > 0) {
                this.cart.push(lesson); //put the lesson in the cart
                lesson.space--;
            }
        },

        // Remove one item from the cart and give the space back to the lesson
        removeFromCart(index) {
            const item = this.cart[index];
            const lesson = this.lessons.find(l => l._id === item._id);
            lesson.space++;                  // space goes back to the lesson list
            this.cart.splice(index, 1);      // remove 1 item at this position
        },

        // GET all lessons from the server
        getLessons() {
            fetch(this.apiUrl + '/lessons')
                .then(response => response.json())        // turn the response into JSON
                .then(data => {
                    this.lessons = data;
                    this.getEnrolments();        // once lessons are loaded, get their booking numbers
                })
                .catch(error => console.error('Could not load lessons:', error));
        },

        //[Challenge: Enrolment] GET /enrolment/:lessonid for every lesson
        getEnrolments() {
            this.lessons.forEach(lesson => {
                fetch(this.apiUrl + '/enrolment/' + lesson._id)
                    .then(response => response.json())
                    .then(data => { this.enrolments[lesson._id] = data.enrolment; })
                    .catch(error => console.error('Could not load enrolment:', error));
            });
        },

        // [Challenge: Search] Ask the server for lessons that match the search text
        searchLessons() {
            if (this.searchTerm.trim() === '') {
                this.searchIds = null;   // empty box -> show all lessons again
                return;
            }
            // encodeURIComponent makes the text safe to put in a URL (spaces, & etc.)
            fetch(this.apiUrl + '/search?q=' + encodeURIComponent(this.searchTerm))
                .then(response => response.json())
                .then(data => {
                    // keep only the ids; we show our own copies so spaces in the cart stay correct
                    this.searchIds = data.map(lesson => lesson._id);
                })
                .catch(error => console.error('Search failed:', error));
        },

        // [Challenge: Teachers] GET all teachers from the server
        getTeachers() {
            fetch(this.apiUrl + '/teachers')
                .then(response => response.json())
                .then(data => {
                    // MongoDB ids arrive as strings, so lessonIds can be compared with lesson._id
                    this.teachers = data;
                })
                .catch(error => console.error('Could not load teachers:', error));
        },

        // Checkout: save the order (POST) and update spaces (PUT)
        checkout() {
            // 1. Group the cart by lesson, e.g, 2 x math -> { lessonId, spaces: 2 }
            const grouped = {};
            this.cart.forEach(item => {
                if (!grouped[item._id]) grouped[item._id] = 0;
                grouped[item._id]++;
            });
            const orderLessons = Object.keys(grouped).map(id => ({ lessonId: id, spaces: grouped[id] }));

            // 2. The order object sent to the server
            const order = {
                name: this.name,
                phone: this.phone,
                lessons: orderLessons
            };

            // 3. POST the new order to the "orders" collection
            fetch(this.apiUrl + '/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            })
                .then(response => response.json())
                .then(() => {
                    // 4. PUT the new number of spaces for every lesson in the order.
                    // Promise.all waits until all the PUT requests have finished
                    const updates = orderLessons.map(item => {
                        const lesson = this.lessons.find(l => l._id === item.lessonId);
                        return fetch(this.apiUrl + '/lessons/' + lesson._id, {

                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ space: lesson.space })
                        });
                    });
                    return Promise.all(updates);
                })
                .then(() => {
                    // 5. Show the confirmation and reset the cart and form
                    this.orderMessage = 'Thank you ' + this.name + '! Your order has been submitted,';
                    this.cart = [];
                    this.name = '';
                    this.phone = '';
                    this.getEnrolments();   // refresh the "Booked" numbers
                })
                .catch(error => {
                    console.error('Checkout failed:', error);
                    this.orderMessage = 'Sorry, something went wrong. Please try again.';
                });
        }
    },

    // --------------------------------------------
    // WATCH: runs a function every time a variable changes
    // --------------------------------------------
    watch: {
        // [Challenge: Search] search "as you type"
        searchTerm() {
            this.searchLessons();
        }
    },

    // ------------------------------------------
    // MOUNTED: runs once when the page first loads
    // ------------------------------------------
    mounted() {
        this.getLessons();
        this.getTeachers();
    }

}).mount('#app');   //connect Vue to <div id="app"> in index.html