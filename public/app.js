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
const addNewFriendTextarea = document.getElementById("friend-newActivitySection");
const newActivityDate = document.querySelector("#friend-newActivityDate");
const newActivityLocation = document.querySelector("#friend-newActivityLocation");
const newActivitySelection = document.querySelector("#friend-newActivitySelection");
const newActivityDescription = document.querySelector("#friend-newActivityWhatHappened");
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
let state = {
    userInfo: {},
    selectedFriendID: "",
    activities: []
}
//========END==========
//========START==========
const getActivities = async () => {
    // Get default and custom activities. 
    let activities = await db.collection("defaultActivities").get().then(snapshot => filterActivities(snapshot));
    activities = activities.concat(await db.collection("user").doc(state.userInfo.uid).collection("customActivities").get().then(snapshot => filterActivities(snapshot)));
    return activities || [];
}

//========END==========
//========START==========
// Click handlers.
signInBtn.onclick = () => auth.signInWithPopup(googleLoginProvider);
signOutBtn.onclick = () => {
    resetState();
    auth.signOut();
}
seeActivitiesButton.onclick = async () => {
    activitiesSection.hidden = false;
    state.activities = await getActivities();
    // Display.
    state.activities.forEach(activity => {
        if (!document.getElementById(activity.id)) appendActivity(activity);
    });
}
newActivityBtn.onclick = () => {
    newActivityForm.hidden = false;
    // Set a listener for customActivity changes. 
    db.collection("user").doc(state.userInfo.uid).collection("customActivities").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "added" && !state.activities.map(activity => activity.id).includes(change.doc.id)) {
                const newActivity = filterActivities(change.doc);
                state.activities.push(newActivity);
                appendActivity(newActivity);
            } else if (change.type === "removed") {

            }
        });
    });
}
//========END==========
//========START==========
// Append activity to DOM.
const appendActivity = activity => {
    console.warn("new activity: ", activity);
    const markup = `
    <li id="${activity.id}">
        <div>${activity.name}</div>
        <div>${activity.description}</div>
    </li>
    `;
    activitiesList.insertAdjacentHTML("beforeend", markup);
}
//========END==========
//========START==========
// Append activity from snapshot.
const filterActivities = snapshot => {
    if (!snapshot.id) { // is retreived from DB.
        let activities = [];

        snapshot.forEach(activity => {
            activities.push({
                id: activity.id,
                name: activity.data().name,
                description: activity.data().description
            });
        })
        return activities;
    } else { // is onSnapshot / change to DB.
        return {
            id: snapshot.id,
            name: snapshot.data().name,
            description: snapshot.data().description
        };
    }
};
//========END==========
//========START==========
// Authenticate user.
auth.onAuthStateChanged(async user => {
    if (user) { // Logged in.
        // Check if they exist in the user collection. If not, 
        db.collection("user").doc(user.uid).get().then(userSnapshot => {
            if (userSnapshot.exists) {
                console.log("User exists!", userSnapshot.data());
                state.userInfo = userSnapshot.data();
                state.userInfo.uid = user.uid;
                showFriendsList();
            } else {
                console.log("User doesn't exist!");
                db.collection("user").doc(user.uid).set({
                        name: user.displayName,
                        lastLoginDate: new Date()
                    }).then(() => {
                        console.log("User successfully written to user collection!");
                        state.userInfo.uid = user.uid;
                        Object.assign(state.userInfo, userSnapshot.data());
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
    state.userInfo = {};
    friendsList.innerHTML = "";
}
//========END==========
//========START==========
const showFriendsList = () => {
    console.log("Showing friends list.");
    db.collection("user").doc(state.userInfo.uid).collection("friends").onSnapshot(friendsSnapshot => {
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
    state.userInfo.friend = {
        firstName: document.querySelector("#fName").value,
        lastName: document.querySelector("#lName").value,
        lastMetDate: document.querySelector("#lastMetDate").value,
        remindFrequency: reminderFrequency.options[reminderFrequency.selectedIndex].value
    }
    // Store new friend. 
    db.collection("user").doc(state.userInfo.uid).collection("friends").add({
            name: `${state.userInfo.friend.firstName} ${state.userInfo.friend.lastName}`,
            lastMetDate: new Date(state.userInfo.friend.lastMetDate),
            remindFrequency: state.userInfo.friend.remindFrequency
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
    db.collection("user").doc(state.userInfo.uid).collection("friends").doc(id).delete()
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
            state.selectedFriendID = friendID;
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

    newActivityDate.value = "";
    newActivityLocation.value = "";
    newActivityDescription.value = "";
    // Activities:
    document.querySelector("#activityName").value = "";
    document.querySelector("#activityDescription").value = "";
}
//========END==========
//========START==========
// Users should be able to add new activities. 
document.querySelector("#newActivityForm").addEventListener("submit", e => {
    e.preventDefault();

    // Store new activity.
    db.collection("user").doc(state.userInfo.uid).collection("customActivities").add({
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
//========START==========
// Users should be able to add new memories. 
document.querySelector("#friend-newActivitySection").addEventListener("submit", e => {
    e.preventDefault();
    console.log("Hello");
    // Store new memory.
    db.collection("user").doc(state.userInfo.uid).collection("friends").doc(state.selectedFriendID).collection("memories").add({
            date: new Date(newActivityDate.value),
            location: newActivityLocation.value,
            description: newActivityDescription.value
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