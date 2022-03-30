const getData = async function (url) {
    const res = await fetch(url);
    return await res.text();
};
