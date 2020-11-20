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
const reminderFrequencyDay = document.getElementById("friendReminderSpecifyDay");
const reminderFrequencyDate = document.getElementById("friendReminderSpecifyDate");
const friendSection = document.getElementById("friendSection");
const seeActivitiesButton = document.getElementById("seeActivities");
const newActivityBtn = document.getElementById("activity-newActivity");
const newActivityForm = document.getElementById("newActivityForm");
const activitiesSection = document.getElementById("activitiesSection");
const activitiesList = document.getElementById("activities");
const addNewFriendActivity = document.getElementById("friend-newActivity");
const addNewFriendMemorySection = document.getElementById("friend-newActivitySection");
const newActivityDate = document.querySelector("#friend-newActivityDate");
const newActivityLocation = document.querySelector("#friend-newActivityLocation");
const newActivitySelection = document.querySelector("#friend-newActivitySelection");
const newActivityDescription = document.querySelector("#friend-newActivityWhatHappened");
const friendReminderList = document.querySelector("#reminderList");
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
    activities: [],
    friends: []
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
                loadReminders();
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
    state.userInfo.newFriend = {
        name: `${document.querySelector("#fName").value} ${document.querySelector("#lName").value}`,
        lastMetDate: document.querySelector("#lastMetDate").value,
        remindFrequency: reminderFrequency.options[reminderFrequency.selectedIndex].value
    }
    // Get specific frequency details.
    switch (reminderFrequency.value) {
        case "daily":
            // What day?
            state.userInfo.newFriend.reminderSpecification = Number(reminderFrequencyDay.value);
            break;
        case "monthly":
            // What date?
            state.userInfo.newFriend.reminderSpecification = Number(reminderFrequencyDate.value);
            break;
    }
    // Store new friend. 
    db.collection("user").doc(state.userInfo.uid).collection("friends").add(state.userInfo.newFriend)
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

    const loadActivityDropdown = async () => {
        // Prepare activity dropdown (select) for adding new memory. 
        if (!state.activities.length) state.activities = await getActivities();

        // Remove existing options (to renew options). 
        while (newActivitySelection.firstChild) {
            newActivitySelection.firstChild.remove();
        }

        state.activities.forEach(activity => {
            // Append activity to dropdown. 
            let option = document.createElement("option");
            option.setAttribute("value", activity.name);
            const text = document.createTextNode(activity.name);
            option.appendChild(text);
            newActivitySelection.appendChild(option);
        });
    }

    loadActivityDropdown();
    displayFriendDetails();
    friendSection.hidden = false;

    addNewFriendActivity.onclick = () => {
        addNewFriendMemorySection.hidden = false;
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
    // Store new memory.
    db.collection("user").doc(state.userInfo.uid).collection("friends").doc(state.selectedFriendID).collection("memories").add({
            date: new Date(newActivityDate.value),
            location: newActivityLocation.value,
            activity: newActivitySelection.value,
            description: newActivityDescription.value
        }).then(docRef => {
            console.log("Document written with ID: ", docRef.data());
        })
        .catch(e => {
            console.error("Error adding document: ", e);
        });
    clearFields();
});
//========END========
//========START==========
const removeElement = (el) => {
    const removeThis = document.querySelector(el);
    removeThis.remove();
}
//========END========
//========START==========
// Users should be able to get reminders on the homescreen. 
const loadReminders = () => {
    console.log("HEllo!");
    // For each friend, 
    db.collection("user").doc(state.userInfo.uid).collection("friends").get().then(friends => {
        friends.forEach(friend => {
            let needsReminding = false; // Flag to see if reminder needs to be given.
            console.log("Friend: ", friend.data());

            // See their lastMetDate and remindFreqeuency. 
            const lastMetDate = new Date(friend.data().lastMetDate);
            const daysSinceLastMet = Math.floor((new Date() - lastMetDate) / (1000 * 60 * 60 * 24));
            console.log("Days since last met: ", daysSinceLastMet);
            let markup = `<ol id="reminderFor-${friend.id}">`;

            switch (friend.data().remindFrequency) {
                case "daily":
                    // If it's a daily reminder, they should be reminded of them daily. 
                    needsReminding = true;
                    markup += `Daily reminder of ${friend.data().name}! Last met on ${lastMetDate}`;
                    break;
                case "weekly":
                    break;
                case "fortnightly":
                    break;
                case "monthly":
                    if (daysSinceLastMet === 30) {
                        needsReminding = true;
                        markup += `Montly reminder of ${friend.data().name}! Last met on ${lastMetDate}`;
                    } else if (daysSinceLastMet > 30) {
                        needsReminding = true;
                        markup += `Catch up with your mate ${friend.data().name}! Haven't seen him in over a month, last met on ${lastMetDate}`;
                    }
                    break;
            }

            if (needsReminding) {
                // Add Memory button:
                markup += `<button type="button" onclick="">Done - Add memory</button>`;
                // Ignore button:
                markup += `<button type="button" onclick="removeElement('#reminderFor-${friend.id}')">Ignore</button>`; // Closing tag.
                // Closeing tab:
                markup += "</ol>";
                friendReminderList.insertAdjacentHTML("beforeend", markup);
            }
        });
    });


    // If it's a weekly reminder, they should be reminded of them every week. "It's been a week since last contact; say hi to them!" After "Contacted", remind them after a week. 
    //      After "Contacted", give them an option to add a memory. 
    //      If ignored, warn them: "You are overdue to saying hi to them! Say hi to them!".




    // If it's a monthly reminder, they should be reminded of them each month. "It's been a month since last contact; say hi to them!" 

}

//========END==========

// Users should be able to specify what day they should be reminded of their friend. If weekly, what day. If montly, what date...

// Users should be able to upload images for their memories. 

// Users should be able to see their past memories with friends. 