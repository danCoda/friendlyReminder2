//========START==========
// Initialize Firebase
const whenSignedIn = document.getElementById("whenSignedIn");
const whenSignedOut = document.getElementById("whenSignedOut");
const signInBtn = document.getElementById("signInBtn");
const friendsList = document.getElementById("friendsList");
const signOutBtn = document.getElementById("signOutBtn");
const userDetails = document.getElementById("userDetails");
//========END==========
//========START==========
// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOEl4ArUJQk4sk4AffRVzhjc2uPdddZdo",
    authDomain: "friendly-reminder-5f22b.firebaseapp.com",
    databaseURL: "https://friendly-reminder-5f22b.firebaseio.com",
    projectId: "friendly-reminder-5f22b",
    storageBucket: "friendly-reminder-5f22b.appspot.com",
    messagingSenderId: "883232786181",
    appId: "1:883232786181:web:f8c869ac713a6167ba996c",
    measurementId: "G-X7MZ1TW5SL"
};
firebase.initializeApp(firebaseConfig);
//firebase.initializeApp();
const db = firebase.firestore();
const auth = firebase.auth();
// Enable login.
const googleLoginProvider = new firebase.auth.GoogleAuthProvider();
//========END==========
//========START==========
// Click handlers.
signInBtn.onclick = () => auth.signInWithPopup(googleLoginProvider);
signOutBtn.onclick = () => auth.signOut();
//========END==========
//========START==========
// Authenticate user.
auth.onAuthStateChanged(async user => {
    if (user) { // Logged in.
        // Check if they exist in the user collection. If not, 
        console.log("User details: ", user.uid);

        db.collection("user").doc(user.uid).get().then(userSnapshot => {
            console.log("User exists? ", userSnapshot.exists);
            if (userSnapshot.exists) {
                console.log("User exists!");
                showFriendsList(user.uid);
            } else {
                console.log("User doesn't exist!");
                db.collection("user").doc(user.uid).set({
                        name: user.displayName,
                        lastLoginDate: new Date()
                    }).then(() => {
                        console.log("User successfully written to user collection!");
                    })
                    .catch(e => {
                        console.error("Error writing document: ", e);
                    });
            };

            whenSignedIn.hidden = false;
            whenSignedOut.hidden = true;
            userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3>`;
        });
    } else { // User is not logged in.
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        userDetails.innerHTML = "";
    }
});
//========END==========
//========START==========
const showFriendsList = (uid) => {
    console.log("Heyo");
    db.collection("user").doc(uid).collection("friends").onSnapshot(friendsSnapshot => {
        let changes = friendsSnapshot.docChanges();
        changes.forEach(change => {

            console.log(change);
            console.log(change.doc.data());

            let li = document.createElement('li');
            const friendName = document.createTextNode(change.doc.data().name);
            li.appendChild(friendName);
            friendsList.appendChild(li);
        });
    });
}
// Login. 

// Add new friend. 
/* db.collection("cities").add({
    name: "Tokyo",
    country: "Japan"
})
.then(function(docRef) {
    console.log("Document written with ID: ", docRef.id);
})
.catch(function(error) {
    console.error("Error adding document: ", error);
}); */