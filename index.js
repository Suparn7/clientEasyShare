const dropZone = document.querySelector(".drop-zone");
const browseBtn = document.querySelector(".browseBtn");
const fileInput = document.querySelector("#fileInput");


const progressContainer = document.querySelector(".progress-container");
const bgProgress = document.querySelector(".bg-progress");
const progressBar = document.querySelector(".progress-bar")
const percentDiv = document.querySelector("#percent");


const fileURLInput = document.querySelector("#fileURL");
const sharingContainer = document.querySelector(".sharing-container");
const copyBtn = document.querySelector("#copyBtn");


const emailForm = document.querySelector("#emailForm");

const copyAlert = document.querySelector(".copyAlert");

const host = "https://easy-share-7.herokuapp.com";
const uploadURL = `${host}/api/files`;
const emailURL = `${host}/api/files/send`;


const maxAllowedSize = 100 * 1024 * 1024; //100mb

dropZone.addEventListener("dragover", (e)=>{
    e.preventDefault();//download hojata hai drag krne se default behaiviour hai

    if(!dropZone.classList.contains("dragged")){
        dropZone.classList.add("dragged");
    }
});

dropZone.addEventListener("dragleave",(e)=> {
    dropZone.classList.remove("dragged");
})

dropZone.addEventListener("drop",(e)=> {
    e.preventDefault();
    dropZone.classList.remove("dragged");
    const files = e.dataTransfer.files;
    console.log(files);
    if(files.length){
        fileInput.files = files;
        uploadFile();//after xhr request file upload krdo
    }
})

fileInput.addEventListener("change",()=>{
    uploadFile();
})

browseBtn.addEventListener("click", ()=>{
    fileInput.click();
})

copyBtn.addEventListener("click", ()=>{
    fileURLInput.select();//select the url
    document.execCommand("copy");//it'll copy the selected url
    showAlert("Link Copied");
})

const uploadFile = ()=> {
    if(fileInput.files.length === 0){
        showAlert("Please Upload file first")
        return;
    }
    if(fileInput.files.length > 1){
        resetFileInput();
        showAlert("Upload 1 file at a time!")
        return;
    }
    const file = fileInput.files[0];//ek hi file upload krne derhe abhi
    if(file.size > maxAllowedSize){
        showAlert("Maximum Allowed File size is 100mb");
        resetFileInput();
        return;
    }
    progressContainer.style.display = "block";//upload hona start hua display hojayega
    const formData = new FormData();
    formData.append("myFile",file);

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = ()=> {//event start,change finish se state milta hai 1,2,3,4 jaise
        if(xhr.readyState === XMLHttpRequest.DONE){
            console.log(xhr.response);//check hojayega upload hua ya nhi
            onUploadSuccess(JSON.parse(xhr.response));//issi link pe jayenge according to response ek JSON object aajati hai lastmei, jismei file rhta hai, parse it as js object
        }
    }

    xhr.upload.onprogress = updateProgress;//to display progress

    xhr.upload.onerror = () =>{//error ane pe
        resetFileInput();
        showAlert(`Error in upload: ${xhr.statusText}`)
    }

    xhr.open("POST", uploadURL); //file post krke leliya open krliya
    xhr.send(formData);//formData mein daaldiya 
}

const updateProgress = (e) => {
    const percent = Math.round( (e.loaded / e.total) * 100);
    // console.log(percent);
    bgProgress.style.width = `${percent}%`
    percentDiv.innerText = percent;
    progressBar.style.transform = `scaleX(${percent/100})`
}

const onUploadSuccess = ({ file: url }) =>{//el file aata hai response mein xhr se, destructure it and get file directly, wrna niche response.file krrhe hote 
    //console.log(url);
    resetFileInput();//after file gets uploaded, remove it from the file input section
    emailForm[2].removeAttribute("disabled");//jab file upload krne wala ho user toh disabled class htana mangta
    progressContainer.style.display = "none";//upload hojane k baad display khtm
    sharingContainer.style.display = "block";
    fileURLInput.value = url;
}

const resetFileInput = () =>{
    fileInput.value = "";
}

emailForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    console.log("form submitted");

    //ab form data bnake email pe bhejenege
    const url = fileURLInput.value;
    const formData = {
        uuid: url.split("/").splice(-1,1)[0],//url ko / k baad split krne pe array aata hai jiske last mein unique id rhti h lets say uuid usko splice(-1,1) se nikaal rhe array ayega 1 hi element ka with uuid so [0]
        emailTo: emailForm.elements["to-email"].value,
        emailFrom: emailForm.elements["from-email"].value
    }

    emailForm[2].setAttribute("disabled", "true");//button hai 2nd element , jab submit krdiya jaye toh fetch krne se pehle form ko disable krna pdega. Ham btn ko disable krrhe, setAttr btn mein jake disabled = true krke ayega

    fetch(emailURL, {
        method: "POST",//post krrhe yaani bhejrhe
        headers:{//kaise bhejrhe, kis format mein? json
            "Content-type": "application/json"
        },
        body: JSON.stringify(formData)//js object json mein bdal jayega, yaahn content bhejrhe
    }).then((res) => res.json()).then(( {success} ) =>{//first then se response ko res.json se return hoyega, success tak async krke wait krrha hoga , 2nd wale then mein jo data ayega usko dekhenge ham
        if(success){
            sharingContainer.style.display = "none";
            showAlert("Email sent");
        }
    })
})

let alertTimer;
const showAlert = (msg) =>{
    copyAlert.innerText = msg;
    copyAlert.style.transform = "translate(-50%,0)";
    clearTimeout(alertTimer);//fullproof UI to stop users from doing any kind of chedkhani, they can't click multiple times 
    alertTimer=  setTimeout(() => {
        copyAlert.style.transform = "translate(-50%,60px)";
    },2000);
}