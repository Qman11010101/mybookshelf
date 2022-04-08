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

let uploadURL;
var booksRegistered = [];
const openbdURL = "https://api.openbd.jp/v1/get?isbn=";

window.addEventListener("DOMContentLoaded", function () {
    uploadURL = localStorage.getItem("endpoint");
    if (uploadURL === null) {
        alert("アップロードURLが登録されていません。前の画面に戻って登録してください。");
    }
});

function deleteRegisteredBook(isbn) {
    const registeredBooksArray = document.getElementById("registeredbooks").children;
    for (let i = 0; i < registeredBooksArray.length; i++) {
        let bookdiv = registeredBooksArray[i];
        if (bookdiv.getElementsByClassName("isbnval")[0].innerText == isbn) {
            bookdiv.remove();
            break;
        }
    }
}

async function registerISBN(isbn) {
    const books = document.getElementById("registeredbooks").children;

    // 同一ISBNの本が登録済みでないか検索
    for (let i = 0; i < books.length; i++) {
        if (books[i].getElementsByClassName("isbnval")[0].innerText === isbn) {
            alert("既に登録されています。");
            return;
        }
    }

    // OpenBDから本の情報を取得
    const bookDataRaw = await getData(openbdURL + isbn);
    const bookData = JSON.parse(bookDataRaw)[0];

    if (bookData === null) {
        alert("入力されたISBNコードの本は存在しないか、データベースに登録されていません。");
        return;
    }

    // 要素追加
    const registered = document.getElementById("registeredbooks");

    const bookdiv = registered.appendChild(document.createElement("div"));
    bookdiv.className = "book";

    const bookISBN = bookData.summary.isbn;
    const bookTitle = bookData.summary.title;

    let bookAuthors = bookData.summary.author;

    const bookPublisher = bookData.summary.publisher;

    const isbnkey = bookdiv.appendChild(document.createElement("span"));
    isbnkey.innerText = "ISBN: ";
    isbnkey.className = "bookkey";

    const isbnval = bookdiv.appendChild(document.createElement("span"));
    isbnval.innerText = bookISBN;
    isbnval.className = "isbnval";

    bookdiv.appendChild(document.createElement("br"));

    const titlekey = bookdiv.appendChild(document.createElement("span"));
    titlekey.innerText = "書名: ";
    titlekey.className = "bookkey";

    const titleval = bookdiv.appendChild(document.createElement("span"));
    titleval.innerText = bookTitle;
    titleval.className = "titleval";

    bookdiv.appendChild(document.createElement("br"));

    const authorkey = bookdiv.appendChild(document.createElement("span"));
    authorkey.innerText = "著者: ";
    authorkey.className = "bookkey";

    const authorval = bookdiv.appendChild(document.createElement("span"));
    authorval.innerText = bookAuthors;
    authorval.className = "authorval";

    bookdiv.appendChild(document.createElement("br"));

    const deleteButton = bookdiv.appendChild(document.createElement("button"));
    deleteButton.className = "remove";
    deleteButton.innerText = "削除する";
    deleteButton.addEventListener("click", function () {
        deleteRegisteredBook(bookISBN);
    });

    // 本をリストに追加
    booksRegistered.push({
        isbn: bookISBN,
        title: bookTitle,
        author: bookAuthors,
        publisher: bookPublisher
    });

    // 自動的に下までスクロールする
    registered.scrollTop = registered.scrollHeight;
}

// action: "write"もしくは"delete"
// URL自体は"search"も受け付けるがここではこの2つしか扱わない
async function postBook(action) {
    uploadURL = localStorage.getItem("endpoint");
    if (uploadURL === null) {
        alert("アップロードURLが登録されていません。前の画面に戻って登録してください。");
        return;
    }

    const dataStr = await base64Encode(JSON.stringify(booksRegistered));

    // 送信
    const loader = document.getElementById("postloader");
    loader.style.display = "block";
    const responseRaw = await fetch(uploadURL + "?b=" + encodeURIComponent(dataStr) + "&action=" + action);
    const response = await responseRaw.json();
    if (response.code === 200) {
        loader.style.display = "none";
        const doneregisterEndpoint = document.getElementById("doneendpoint");
        doneregisterEndpoint.style.display = "block";
        setTimeout(function () {
            doneregisterEndpoint.style.display = "none";
        }, 3000);
    } else {
        alert(`エラーが発生しました(Error ${response.code})`);
        loader.style.display = "none";
    }
}

async function registerISBNFromInput() {
    const isbn = document.getElementById("isbn").value;

    if (isbn === "") {
        alert("ISBNコードが入力されていません。");
        return;
    }

    // TODO: ISBNコードのバリデーション(数字13桁)

    registerISBNInside(isbn);
}