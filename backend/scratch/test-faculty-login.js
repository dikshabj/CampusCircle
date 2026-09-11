async function test() {
    try {
        console.log("Logging in as faculty...");
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: 'faculty1@campusfeed.com',
                password: 'welcome123',
                loginType: 'faculty' // Sending 'faculty' here
            })
        });
        
        if (!loginRes.ok) {
            console.log(await loginRes.text());
            throw new Error(`Login failed: ${loginRes.status}`);
        }
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        const user = loginData.user;
        console.log("Success! Logged in as User:", user.role, user.email);

    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
