import { apiUrl } from './config.js';

async function getQuizCards() {
    let data = await fetch(`${apiUrl}/quiz`);
    return data.json();
}

async function createQuizApi(payload) {
    try {
        const res = await fetch(`${apiUrl}/quiz/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || res.statusText);

        //console.log("Quiz created:", data);
        alert("Quiz created successfully!");
        //document.getElementById("quizForm")?.reset?.();
    } catch (err) {
        console.error("Error creating quiz:", err);
        alert("สร้างควิซไม่สำเร็จ: " + err.message);
    }
};

async function getQuizById(id) {
    let data = await fetch(`${apiUrl}/quiz/${id}`);
    return data.json();
}

async function deleteQuizById(id) {
    let data = await fetch(`${apiUrl}/quiz/${id}`, {
        method: 'DELETE'
    });
    return data.json();
}

async function getTags() {
    let data = await fetch(`${apiUrl}/tag`);
    return data.json();
}

async function createTag(tag) {
    let data = await fetch(`${apiUrl}/tag/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tag })
    });
    return data.json();
}

async function deleteTag(id) {
    let data = await fetch(`${apiUrl}/tag/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    return data.json();
}

async function sendAskRequest(message) {
    try {
        const response = await fetch(`${apiUrl}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: message })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || response.statusText);
        
        return data;
    } catch (err) {
        console.error("Error sending ask request:", err);
        throw err;
    }
}

async function updateQuizById(id, payload) {
    try {
        const res = await fetch(`${apiUrl}/quiz/update/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || res.statusText);

        return data;
    } catch (err) {
        console.error("Error updating quiz:", err);
        throw err;
    }
}

export { getQuizCards, createQuizApi, getQuizById, deleteQuizById, getTags, createTag, deleteTag, sendAskRequest, updateQuizById };