let i=0;
let j=0;
let k =0;

const cards = ['card1', 'card2', 'card3', 'card4', 'card5', 'card6']
const images1 = ['image1', 'image2', 'image3', 'image4', 'image5', 'image6'];
const texts = ['text1', 'text2', 'text3', 'text4', 'text5', 'text6'];
const texts2 = [['HTML et CSS et JS', 'finance'], ['JAVA Projets', 'Game developper'], ['Python Projets', 'Algorithme'], ['Base de donner', 'comptabilite'], ['UML', 'Computer architecture'], ['C++', 'Statistique']];
const image2 = [['images/jscode.jpeg','images/finance.jpeg'], ['images/javacode.jpeg','images/gamedev.jpeg'], ['images/pythoncode.png','images/algorith.jpeg'], ['images/basededonne.jpeg','images/comptabile.jpeg'], ['images/uml.jpeg','images/compter.jpeg'], ['images/c++code.jpeg','images/statistic.jpeg']];


let time = 2000;
const image = document.getElementById('images');
function change_image(){
    image.src = image2[i][k];
    if(i<image2.length-1){
        i++;
    }else{
        if(k === 0){
            k++;
        }else{
            k--;
        }
        i=0;
        
    }
    setTimeout("change_image()", time);
}

function carde(){
    let card = document.getElementById(cards[j]);
    let image3 = document.getElementById(images1[j]);
    let text = document.getElementById(texts[j]);
    image3.src = image2[j][k];
    text.textContent = texts2[j][k];
    card.style.transform = "scale(1.1)";
    if(j<cards.length-1){
        j++;
    }else{
        j=0;
        if(k === 0){
            k++;
        }else{
            k--;
        }
    }
    setTimeout("carde1()", time);
}
function carde1(){
    if(j==0){
        const card = document.getElementById(cards[cards.length-1]);
        card.style.transform = "scale(1)";
    }else{
        const card = document.getElementById(cards[j-1]);
        card.style.transform = "scale(1)";
    }
    
    carde();
}
function loading(){
    const image = document.getElementById('images');
    if(image){
        change_image();
    }else{
         carde();
    }
    
}

window.loading();