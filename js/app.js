const {createApp} = Vue;


createApp({

    // ---------------------------
    // Data: the variables the page uses. When they change, Vue
    // automatically updates the HTML
    // --------------

    data() {
        return {
            siteName: 'AfterSchool Connect',

            apiUrl: 'http://localhost:3000',

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
            const teacher = this.teachers.find(t => t._id === this.selectedteacher);
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

    
})