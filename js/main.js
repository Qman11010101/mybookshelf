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
    for (let i = 0; i < booksRegistered.length; i++) {
        if (booksRegistered[i].isbn === isbn) {
            booksRegistered.splice(i, 1);
            break;
        }
    }
}

async function registerISBN(isbn) {
    const books = document.getElementById("registeredbooks").children;

    // 同一ISBNの本が登録済みでないか検索
    for (let i = 0; i < books.length; i++) {
        if (books[i].getElementsByClassName("isbnval")[0].innerText === isbn) {
            return "Already registered";
        }
    }

    // OpenBDから本の情報を取得
    const bookDataRaw = await getData(openbdURL + isbn);
    const bookData = JSON.parse(bookDataRaw)[0];

    if (bookData === null) {
        return "Noexist";
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

    if (booksRegistered === []) {
        alert("本が登録されていません");
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
        let element = document.getElementById("registeredbooks");
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        booksRegistered = [];
        const donepostbook = document.getElementById("postbook");
        donepostbook.innerText = "✓ 送信しました";
        setTimeout(function () {
            donepostbook.innerText = "送信する";
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

    let codeArray = isbn.split("").map(n => parseInt(n));
    let remainder = 0;
    const checkDigit = codeArray.pop();

    codeArray.forEach((num, index) => {
        remainder += num * (index % 2 === 0 ? 1 : 3);
    });
    remainder %= 10;
    remainder = remainder === 0 ? 0 : 10 - remainder;

    if (checkDigit !== remainder) {
        alert("チェックディジットの照合に失敗しました。入力にミスがないか、もう一度確かめてください");
        return;
    }

    const resp = await registerISBN(isbn);
    console.log(resp)
    if (resp === "Already registered") {
        alert("既に登録されています");
    } else if (resp === "Noexist") {
        alert("入力されたISBNの書籍はデータベース上に存在していないため、登録できません");
    }
}
