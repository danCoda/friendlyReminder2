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
// State information. 
let userInfo = {};
//========END==========
//========START==========
// Click handlers.
signInBtn.onclick = () => auth.signInWithPopup(googleLoginProvider);
signOutBtn.onclick = () => {
    resetState();
    auth.signOut();
}
//========END==========
//========START==========
// Authenticate user.
auth.onAuthStateChanged(async user => {
    if (user) { // Logged in.
        // Check if they exist in the user collection. If not, 
        db.collection("user").doc(user.uid).get().then(userSnapshot => {
            console.log("User exists? ", userSnapshot.exists);
            if (userSnapshot.exists) {
                console.log("User exists!", userSnapshot.data());
                userInfo = userSnapshot.data();
                userInfo.uid = user.uid;
                showFriendsList();
            } else {
                console.log("User doesn't exist!");
                db.collection("user").doc(user.uid).set({
                        name: user.displayName,
                        lastLoginDate: new Date()
                    }).then(() => {
                        console.log("User successfully written to user collection!");
                        userInfo.uid = user.uid;
                        Object.assign(userInfo, userSnapshot.data());
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
        resetState();
    }
});
//========END==========
//========START==========
const resetState = () => {
    userInfo = {};
    document.getElementById("friendsList").innerHTML = "";
}
//========END==========
//========START==========
const showFriendsList = () => {
    console.log("Heyo");
    db.collection("user").doc(userInfo.uid).collection("friends").onSnapshot(friendsSnapshot => {
        let changes = friendsSnapshot.docChanges();
        console.log("CHanges: ", changes);
        window.changes = changes;
        changes.forEach(change => {
            console.log(change.type);
            console.log(change.doc.id);

            if (change.type === "added") {
                console.log("Added");
                const markup = `
                    <li class="friendListFriend" id="${change.doc.id}">
                        <a href="">${change.doc.data().name}</a>
                        <button type="button" onclick="deleteFriend('${change.doc.id}')">x</button>
                    </li>
                    `;
                friendsList.insertAdjacentHTML("beforeend", markup);
            }
            if (change.type === "modified") {
                console.log("Modified");
                // If the name or ID's changed, update the UI.
            }
            if (change.type === "removed") {
                // Remove friend from list.
                console.log("Removed");
                const friendNode = document.querySelector(`#${change.doc.id}`);
                if (friendNode) friendNode.parentElement.removeChild(friendNode);
            }
        });
    });
}
//========END==========
//========START==========
// Add new friend.
document.querySelector(".newFriendForm").addEventListener('submit', e => {
    e.preventDefault();
    // Get new friend input. 
    userInfo.friend = {
        firstName: document.querySelector("#fName").value,
        lastName: document.querySelector("#lName").value,
        lastMetDate: document.querySelector("#lastMetDate").value
    }
    // Store new friend. 
    db.collection("user").doc(userInfo.uid).collection("friends").add({
            name: `${userInfo.friend.firstName} ${userInfo.friend.lastName}`,
            lastMetDate: new Date(userInfo.friend.lastMetDate)
        })
        .then(docRef => {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(e => {
            console.error("Error adding document: ", e);
        });
    console.log(userInfo.friend);
});
//========END==========
//========START==========
// Delete friend.
const deleteFriend = id => {
    // Delete from Firebase. 
    db.collection("user").doc(userInfo.uid).collection("friends").doc(id).delete()
        .then(() => {
            console.log("Document successfully deleted!");
        }).catch(e => {
            console.error("Error removing document: ", e);
        });
}
//========END==========

/* export const deleteLike = id => {
    const el = document.querySelector(`.likes__link[href*="${id}"]`).parentElement;
    if (el) el.parentElement.removeChild(el);
}
 */