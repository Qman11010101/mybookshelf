const getData = async function (url) {
    const res = await fetch(url);
    return await res.text();
};

function base64Encode(...parts) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
            const offset = reader.result.indexOf(",") + 1;
            resolve(reader.result.slice(offset));
        };
        reader.readAsDataURL(new Blob(parts));
    });
}