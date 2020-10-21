alert("Hello Dan");

//========START==========
// Initialize Firebase
const whenSignedIn = document.getElementById("whenSignedIn");
const whenSignedOut = document.getElementById("whenSignedOut");
const signInBtn = document.getElementById("signInBtn");
const friendsList = document.getElementById("friendsList");
const signOutBtn = document.getElementById("signOutBtn");
const userDetails = document.getElementById("userDetails");
const reminderFrequency = document.getElementById("friendRemindFrequency");
const friendSection = document.getElementById("friendSection");
const seeActivitiesButton = document.getElementById("seeActivities");
const newActivityBtn = document.getElementById("activity-newActivity");
const newActivityForm = document.getElementById("newActivityForm");
const activitiesSection = document.getElementById("activitiesSection");
const activitiesList = document.getElementById("activities");

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
seeActivitiesButton.onclick = async () => {
    const getActivities = (snapshot => {
        let activities = [];
        snapshot.forEach(activity => {
            activities.push({
                id: activity.id,
                name: activity.data().name,
                description: activity.data().description
            });
        });
        return activities;
    });

    const appendActivity = activity => {
        const markup = `
        <li id="${activity.id}">
            <div>${activity.name}</div>
            <div>${activity.description}</div>
        </li>
        `;
        activitiesList.insertAdjacentHTML("beforeend", markup);
    }

    activitiesSection.hidden = false;

    // Get activities. Default activities, and then custom activities.
    let activities = await db.collection("defaultActivities").get().then(snapshot => getActivities(snapshot));
    
    // Trying to act on live changes.
    db.collection("user").doc(userInfo.uid).collection("customActivities").onSnapshot(activitiesSnapshot => {
        let changes = activitiesSnapshot.docChanges();
        console.log("Changes to activities!");
        changes.forEach(change => {
            console.log(change.doc.id, change.type);
            
            if (change.type === "added") {
                appendActivity(change.doc.data());
            };
        });

    });

    // Doesn't act on live changes.
    //activities = activities.concat(await db.collection("user").doc(userInfo.uid).collection("customActivities").get().then(snapshot => getActivities(snapshot)));
    
    // Display.
    activities.forEach(activity => {
       appendActivity(activity);
    });
}
newActivityBtn.onclick = () => {
    newActivityForm.hidden = false;
}
//========END==========
//========START==========
// Authenticate user.
auth.onAuthStateChanged(async user => {
    if (user) { // Logged in.
        // Check if they exist in the user collection. If not, 
        db.collection("user").doc(user.uid).get().then(userSnapshot => {
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
        });

        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        seeActivitiesButton.hidden = false;
        userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3>`;
    } else { // User is not logged in.
        resetState();
    }
});
//========END==========
//========START==========
const resetState = () => {
    whenSignedIn.hidden = true;
    whenSignedOut.hidden = false;
    activitiesSection.hidden = true;
    seeActivitiesButton.hidden = true;
    newActivityForm.hidden = true;
    userDetails.innerHTML = "";
    userInfo = {};
    friendsList.innerHTML = "";
}
//========END==========
//========START==========
const showFriendsList = () => {
    console.log("Showing friends list.");
    db.collection("user").doc(userInfo.uid).collection("friends").onSnapshot(friendsSnapshot => {
        let changes = friendsSnapshot.docChanges();
        console.log("CHanges: ", changes);
        changes.forEach(change => {
            console.log(change.doc.id, change.type);

            if (change.type === "added") {
                const markup = `
                    <li class="friendListFriend" id="${change.doc.id}">
                        <div>Friend: ${change.doc.data().name}
                            <button type="button" onclick="deleteFriend('${change.doc.id}')">x</button>
                        </div>
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

            setFriendsClickHandlers(change.doc.id, change.doc.data(), change.type !== "removed");
        });

    });
}
//========END==========
//========START==========
// Add new friend.
document.querySelector(".newFriendForm").addEventListener('submit', e => {
    e.preventDefault();
    // Get new friend input. 
    console.warn(reminderFrequency.options[reminderFrequency.selectedIndex].value);
    userInfo.friend = {
        firstName: document.querySelector("#fName").value,
        lastName: document.querySelector("#lName").value,
        lastMetDate: document.querySelector("#lastMetDate").value,
        remindFrequency: reminderFrequency.options[reminderFrequency.selectedIndex].value
    }
    // Store new friend. 
    db.collection("user").doc(userInfo.uid).collection("friends").add({
            name: `${userInfo.friend.firstName} ${userInfo.friend.lastName}`,
            lastMetDate: new Date(userInfo.friend.lastMetDate),
            remindFrequency: userInfo.friend.remindFrequency
        })
        .then(docRef => {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(e => {
            console.error("Error adding document: ", e);
        });
    clearFields();
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
//========START==========
// Click handlers for user's friends.
const setFriendsClickHandlers = (friendID, friendDetails, isFriendAdded) => {
    if (isFriendAdded) {
        // Friend is added or modified, thus must have a click handler.
        const friendElement = document.getElementById(friendID);
        friendElement.onclick = () => {
            console.log(friendID, friendDetails, isFriendAdded);

            console.log(`Friend ${friendID} was clicked!`);
            displayFriendSection(friendDetails);
        }
    } else {
        // Remove click handler.
    }
}
//========END==========
//========START==========
const displayFriendSection = friendDetails => {
    const displayFriendDetails = () => {
        document.getElementById("friend-name").textContent = friendDetails.name;
        document.getElementById("friend-lastMetDate").textContent = friendDetails.lastMetDate.toDate();
        document.getElementById("friend-remindFrequency").textContent = friendDetails.remindFrequency;
        document.getElementById("friend-lastActivity").textContent = friendDetails.lastActivity;
    }

    console.log("Frienc clicked... ", friendDetails);
    friendSection.hidden = false;
    displayFriendDetails();

    const addNewFriend = document.getElementById("friend-newActivity");
    addNewFriend.onclick = () => {
        const addNewFriendTextarea = document.getElementById("friend-newActivitySection");
        addNewFriendTextarea.hidden = false;

    };
}
//========END==========
//========START==========
const clearFields = () => {
    // Friends:
    document.querySelector("#fName").value = "";
    document.querySelector("#lName").value = "";
    document.querySelector("#lastMetDate").value = "";
    reminderFrequency.selectedIndex = 0;

    // Activities:
    document.querySelector("#activityName").value = "";
    document.querySelector("#activityDescription").value = "";
}
//========END==========
//========START==========
// Users should be able to add new activities. 
document.querySelector("#newActivityForm").addEventListener("submit", e => {
    e.preventDefault();

    db.collection("user").doc(userInfo.uid).collection("customActivities").add({
            name: document.querySelector("#activityName").value,
            description: document.querySelector("#activityDescription").value
        }).then(docRef => {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(e => {
            console.error("Error adding document: ", e);
        });
    clearFields();
});
//========END==========

// Users should be able to choose between these activities when they add memories. 