
import axios from 'axios';

async function testRoute(slug) {
    const url = `http://localhost:5000/api/blogs/slug/${slug}`;
    try {
        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url);
        console.log('Success:', response.status);
    } catch (error) {
        console.error('Error:', error.response ? error.response.status : error.message);
        if (error.response && typeof error.response.data === 'string' && error.response.data.includes('html')) {
            console.error('Response is HTML (Express 404)');
        } else if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

async function run() {
    await testRoute("test");
    await testRoute("beyond-the-dust-why-tanzanias-emerald-season-is-the-safari-connoisseurs-best-kept-secret");
}

run();
