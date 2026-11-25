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
})