async function test() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: 'student1@campusfeed.com',
                password: 'welcome123',
                loginType: 'student'
            })
        });
        
        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        const user = loginData.user;
        console.log("User:", user.role, user.batchId);

        const headers = { Authorization: `Bearer ${token}` };

        console.log("Fetching attendance...");
        let res = await fetch('http://localhost:3000/api/attendance/my-attendance', { headers });
        console.log("Attendance Status:", res.status);
        if(!res.ok) console.log(await res.text());

        console.log("Fetching subjects...");
        res = await fetch('http://localhost:3000/api/subjects' + (user.batchId ? `?batchId=${user.batchId}` : ''), { headers });
        console.log("Subjects Status:", res.status);
        if(!res.ok) console.log(await res.text());

        console.log("Fetching posts...");
        res = await fetch('http://localhost:3000/api/posts' + (user.batchId ? `?batchId=${user.batchId}` : ''), { headers });
        console.log("Posts Status:", res.status);
        if(!res.ok) console.log(await res.text());

        console.log("Fetching timetables...");
        if (user.batchId) {
            res = await fetch('http://localhost:3000/api/timetables?batchId=' + user.batchId, { headers });
            console.log("Timetables Status:", res.status);
            if(!res.ok) console.log(await res.text());
        }
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
