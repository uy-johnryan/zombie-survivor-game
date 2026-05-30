//database for leaderboard
import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

export async function load_leaderboard() {
    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = "";

    const q = query(
        collection(db, "leaderboard"),
        orderBy("score", "desc"),
        limit(10)
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement("li");
        li.textContent = `${data.username} - ${data.score}`;
        leaderboardList.appendChild(li);
    });
}