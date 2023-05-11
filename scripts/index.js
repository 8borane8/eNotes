const API_URL = "https://api.ecoledirecte.com/v3";
const API_VERSION = "4.31.1";

const inputUsername = document.querySelector("form > input[name='username']");
const inputPassword = document.querySelector("form > input[name='password']");
const labelError = document.querySelector("form > p:nth-last-child(2)");
const animationPlayer = document.querySelector("form > :last-child");

const containerButtons = document.querySelector("main > div:nth-child(1)");
const containerNotes = document.querySelector("main > div:nth-child(2)");

const labelTotalAverage = document.getElementById("total-average-label");

let TOKEN = null;
let ID = null;
let NOTES = null;

function loadNotes(notes){
    console.log(notes)
    const notesPerMatiere = new Map();
    for(let note of notes){
        if(!notesPerMatiere.has(note.libelleMatiere)){
            notesPerMatiere.set(note.libelleMatiere, []);
        }

        note = structuredClone(note);
        note.valeur = Math.round(parseFloat(note.valeur.replace(',', '.')) / note.noteSur * 20 * 100) / 100;
        note.coef = parseFloat(note.coef.replace(',', '.'));
        if(isNaN(note.valeur)){ continue; }
        notesPerMatiere.get(note.libelleMatiere).push(note);
    }

    let finalHtml = `<div><p>Matière</p><p>Notes</p><p>Moyenne</p></div>`;
    let totalAverages = 0;
    let sizesAverages = 0;
    for(const matiere of notesPerMatiere.keys()){
        let notesHtml = "";
        let notesTotal = 0;
        let coefsTotal = 0;
        for(const note of notesPerMatiere.get(matiere)){
            if(note.nonSignificatif){
                notesHtml += `<p>(${note.valeur})</p>`;
                continue;
            }
            notesHtml += `<p>${note.valeur}${note.coef == 1 ? "" : ` <span>(${note.coef})</span>`}</p>`;
            notesTotal += note.valeur * note.coef;
            coefsTotal += note.coef;
        }

        let average = notesTotal / coefsTotal;
        finalHtml += `
        <div>
            <p>${matiere}</p>
            <div>${notesHtml}</div>
            <p>${Math.round(average * 100) / 100}</p>
        </div>`;
        if(isNaN(average)){ continue; }
        totalAverages += notesTotal / coefsTotal;
        sizesAverages += 1;
    }
    containerNotes.innerHTML = finalHtml;
    labelTotalAverage.textContent = Math.round(totalAverages / sizesAverages * 100) / 100;
}

function loadPeriode(event){
    if(event.target.classList.contains("active")){ return; }

    document.querySelector("main > div:nth-child(1) > button.active").classList.remove("active");
    event.target.classList.add("active");

    let codePeriode = event.target.getAttribute("codePeriode");
    if(codePeriode == "A999Z"){
        loadNotes(NOTES);
        return;
    }
    loadNotes(NOTES.filter(n => n.codePeriode.includes(codePeriode)));
}

async function updateNotes(){
    const response = await (await fetch(`${API_URL}/eleves/${ID}/notes.awp?verbe=get&v=${API_VERSION}`, {
        method: "POST",
        headers: { "X-Token": TOKEN },
        body: `data={"anneeScolaire": ""}`
    })).json();

    TOKEN = response.token;
    NOTES = response.data.notes;

    loadNotes(response.data.notes);

    response.data.periodes.forEach(function(periode){
        const button = document.createElement("button");
        button.setAttribute("codePeriode", periode.codePeriode);
        button.textContent = periode.periode;

        button.addEventListener("click", loadPeriode);

        containerButtons.appendChild(button);
    });
    document.querySelector("main > div:nth-child(1) > button:last-child").classList.add("active");
}


document.querySelector("form").addEventListener("submit", async function(event){
    event.preventDefault();

    if(animationPlayer.style.opacity == 1){ return; }
    animationPlayer.style.opacity = 1;
    labelError.style.opacity = 0;

    const response = await (await fetch(`${API_URL}/login.awp?v=${API_VERSION}`, {
        method: "POST",
        body: `data=${JSON.stringify({
            "identifiant": inputUsername.value,
            "motdepasse": inputPassword.value
        })}`
    })).json();

    if(response.code != 200){
        labelError.style.opacity = 1;
        animationPlayer.style.opacity = 0;
        return;
    }

    TOKEN = response.token;
    ID = response.data.accounts[0].id;
    await updateNotes();

    document.querySelector("form").style.display = "none";
    document.querySelector("main").style.display = "flex";
});