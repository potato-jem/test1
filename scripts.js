
if (!localStorage.getItem('userID')) {
    // Set the value if it doesn't exist
    localStorage.setItem('userID', uuid.v4());
}
if (!sessionStorage.getItem('sessionID')) {
    // Set the value if it doesn't exist
    sessionStorage.setItem('sessionID', uuid.v4());
}

// document.getElementById('showParams').addEventListener('change', function() {
//     var toggleElement = document.getElementById('params');
//     if (this.checked) {
//         toggleElement.style.display = 'flex';
//     } else {
//         toggleElement.style.display = 'none';
//     }
// })
// model2

const firebaseConfig = {
    apiKey: atob('QUl6YVN5QzdoektwbWhXMUFOVzRPWm8xZkxfU1pYYVZzT1ExT2FF'),
    authDomain: "potato-jem.firebaseapp.com",
    databaseURL: "https://potato-jem-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "potato-jem",
    storageBucket: "potato-jem.appspot.com",
    messagingSenderId: "124710166334",
    appId: atob('MToxMjQ3MTAxNjYzMzQ6d2ViOmU3MTQ1ZjRkYjA1Y2VjMGM4YTE2NmY='),
    measurementId: "G-GM61YTH9G5"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
answer = ""
now = new Date();
todaysDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
selectedDate = todaysDate;
stale_id=""
minDate=new Date(2024, 9, 10) //Month is zero indexed
maxDate=todaysDate;
maxAttempts=5;
attemptId=1;

getTodaysWords(dateToUse=selectedDate);



// if (!localStorage.getItem('scoreList')) {
//     // Set the value if it doesn't exist
//     let scoreFromParsedHistory=Object.keys(localStorage).filter(key => {
//         const date = new Date(key);
//         return !isNaN(date) &&date>minDate
//       }).map(key=>JSON.parse(localStorage.getItem(key)).bestScore);
//     localStorage.setItem('scoreList', JSON.stringify(scoreFromParsedHistory));
    
//     let currentStreak=scoreFromParsedHistory.reverse().indexOf(0);
//     if(currentStreak==-1){
//         currentStreak=scoreFromParsedHistory.length
//     }
//     localStorage.setItem('streak', currentStreak);
//     localStorage.setItem('streakBest', currentStreak);
// } 

// scoreList=JSON.parse(localStorage.getItem('scoreList'));


function setRandomWords(min,max) {
    let minI=all_words[2].findIndex((x)=>x>=min)
    let maxI=all_words[2].findIndex((x)=>x>max)
    if(maxI==-1){
        maxI=all_words[2].length
    }
    const selectedIndex = minI+Math.floor(Math.random() * (maxI-minI));

    out=[all_words[0][selectedIndex],all_words[1][selectedIndex],all_words[2][selectedIndex]]
    //for(const v of uniqueNumbers){out.push(all_words[v])}
    document.getElementById('targetWord1').value = out[0]
    document.getElementById('targetWord2').value = out[1]
    //document.getElementById('difficulty').value = Math.round((out[2]*100))
    return(out)
}

async function getTodaysWords(dateToUse=new Date(), env="PROD1"){
    //todaysDate = new Intl.DateTimeFormat('en-CA').format(new Date());
    // const referenceDate = new Date('2024-08-20'); 
    // Convert the time difference from milliseconds to days
    //const dayDifference = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));
    formattedDate=new Intl.DateTimeFormat('en-CA').format(dateToUse);
    document.getElementById('date').innerHTML=formattedDate;
    const docRef = db.collection("/targets/"+env+"/todays_word/").doc(formattedDate)

    collection="/targets/"+env+"/reviewed_items"
    selected_word = await docRef.get()
    if (selected_word.exists) {
        todays_word_item=selected_word.data()
        docId=todays_word_item.id;
        chosen_item=await db.collection(todays_word_item.collection).doc(todays_word_item.id).get()
        data=chosen_item.data()
    } else {
        chosen_item=await db.collection(collection).limit(1).get()
        if(chosen_item.size==0){
            collection="/targets/"+env+"/potential_items"
            chosen_item=await db.collection(collection).orderBy('__name__').limit(1).get()
            if(chosen_item.size==0){
                console.log("No items found")
            }
        }
        data=chosen_item.docs[0].data()
        docId=chosen_item.docs[0].id;
        data.user_count=data.user_count+1;
        data.stale=true;
        data.date=formattedDate;
        await db.collection("/targets/"+env+"/stale_items").doc(docId).set(data);
        await db.collection(collection).doc(docId).delete();;
        todays_word_item={};
        todays_word_item.collection="/targets/"+env+"/stale_items"
        todays_word_item.date=new Date();
        todays_word_item.id=docId
        await docRef.set(todays_word_item);
    }

        document.getElementById('targetWord1').innerHTML = data.target1.trim();
        document.getElementById('targetWord2').innerHTML = data.target2.trim();
       // document.getElementById('difficulty').value =  data.difficulty;
        answer = data.answer;
        stale_id=docId;
        document.getElementById('info').innerHTML=JSON.stringify(data, null, 2);
        getHistory(dateToUse,type="best",targets=[data.target1.trim(),data.target2.trim()],animation=false);
}


function getHistory(dateToUse,type="best",targets=[null,null],animation=false){
// Retrieve and parse the data from localStorage
    const storedHistory = localStorage.getItem(dateToUse);
    if (storedHistory) {
        parsedHistory = JSON.parse(storedHistory);
        if(parsedHistory.allAttempts.length>0){
            if(type=="best"){
                attemptId=parsedHistory.bestAttemptId;
            } else if (type=="latest"){
                attemptId=parsedHistory.allAttempts.length;
            } else if (type=="previous"){
                attemptId=Math.max(1,attemptId-1);
            } else if (type=="next"){
                attemptId=Math.min(attemptId+1,parsedHistory.allAttempts.length);
            } else {
                attemptId=type;
            }
            var attempt = parsedHistory.allAttempts.at(attemptId-1);
            clearFormatting();
            document.getElementById('inputText').value=attempt.prompt;
            addFormatting(attempt.result);
            displayResults(animation,score=attempt.score);
        } else {
            document.getElementById('inputText').value="";
            attemptId=1;
            clearFormatting();
        }
    } else {
        parsedHistory = {
            date: dateToUse,
            targetId: stale_id,
            targets: [targets[1],targets[2]],
            attemptsMade: 0,
            bestScore: null,
            bestPrompt: null,
            bestAttemptId: null,
            allAttempts: [],
            solutionViewed: false
        };
        // Store the data as a JSON string in localStorage
        localStorage.setItem(selectedDate, JSON.stringify(parsedHistory));
        document.getElementById('inputText').value="";
        attemptId=1;
        clearFormatting();
    }
    parsedHistory.attemptsRemaining=maxAttempts-parsedHistory.attemptsMade;
    if(parsedHistory.solutionViewed==true){
        viewAnswer()
    } 
    
}
// function update

//setRandomWords(+document.getElementById('minD').value,+document.getElementById('maxD').value);


// document.getElementById('refreshWords').addEventListener('click', async () => {
//     setRandomWords(+document.getElementById('minD').value,+document.getElementById('maxD').value);
// });
function viewAnswer(){
    answerId=document.getElementById('answerID');
    answerId.innerHTML  =  `Possible answer: ${answer}`;

    if(!document.getElementById('answerID').classList.contains("is-hidden")){
        document.getElementById('info').classList.remove("is-hidden");
    }
    document.getElementById('answerID').classList.remove("is-hidden");
    document.getElementById('viewAnswer').classList.add("viewedSolution");
    //parsedHistory.attemptsMade=maxAttempts;
    parsedHistory.attemptsRemaining=0;
    parsedHistory.solutionViewed=true;
    document.getElementById('generateButton').classList.add("is-transparent")
    // document.getElementById('generateButton').disabled=true;
    localStorage.setItem(selectedDate, JSON.stringify(parsedHistory))
}

document.getElementById('viewAnswer').addEventListener('click', async () => {
    viewAnswer()
});
// document.getElementById('hideAnswer').addEventListener('click', async () => {
//     document.getElementById('answerID').innerHTML  =  "";
//     document.getElementById('answerID').classList.add("is-hidden");
//     document.getElementById('info').classList.add("is-hidden");
// });
async function updateDocument(collectionName, documentId, updatedData) {
    try {
      const docRef = db.collection(collectionName).doc(documentId);
      await docRef.update(updatedData);
      console.log("Document successfully updated!");
    } catch (error) {
      console.error("Error updating document:", error);
    }
  }
document.getElementById('leftButton').addEventListener('click', async () => {
    updatedDate=new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000);
    if(updatedDate>=minDate){
        selectedDate=updatedDate;
        getTodaysWords(dateToUse=selectedDate);
        }
    }
    
)
document.getElementById('rightButton').addEventListener('click', async () => {
    updatedDate=new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
    if(updatedDate<=maxDate){
        selectedDate=updatedDate;
        getTodaysWords(dateToUse=selectedDate);
        }   
    }   
)
document.getElementById('leftButtonAnswer').addEventListener('click', async () => {
    getHistory(selectedDate,type="previous",animation=false)
}
)
document.getElementById('rightButtonAnswer').addEventListener('click', async () => {
    getHistory(selectedDate,type="next",animation=false)
}
)

function clearFormatting(){
    for (let i = 0; i < 5; i++) {
        var element=document.getElementById('result-word-'+(i+1))
        element.querySelector('.new-word').innerHTML = "";
        // element.style.display = 'none';
        element.classList.add("is-hidden");
        element.classList.remove("found-word")
        element.querySelector('.result-bar').style.width = 0;
        element.querySelector('.result-bar').classList.remove('match-1-bar','match-2-bar');
        element.querySelector('.new-word').classList.remove('match-1-text','match-2-text');
        element.classList.remove('match-1','match-2');
    }
    if(attemptId<=1){
        document.getElementById('leftButtonAnswer').classList.add("is-hidden");
        document.getElementById('rightButtonAnswer').classList.add("is-hidden");
        document.getElementById('attemptNumber').classList.add("is-hidden");
    }
    document.getElementById('rightButton').classList.remove("is-invisible")
    document.getElementById('leftButton').classList.remove("is-invisible")

    if(selectedDate-todaysDate==0){document.getElementById('rightButton').classList.add("is-invisible")}
    if(selectedDate-minDate==0){document.getElementById('leftButton').classList.add("is-invisible")}
    document.getElementById('results').style.display = 'none';
    document.getElementById('stars').classList.add('is-hidden')//.style.display = 'none';
    Array.from(document.getElementsByClassName("streakBox")).forEach(element => {element.classList.add('is-invisible')});
    document.getElementById('star-1').classList.remove('filled', 'outline');
    document.getElementById('star-2').classList.remove('filled', 'outline');
    document.getElementById('star-3').classList.remove('filled', 'outline');
    document.getElementById('answerBox').classList.add("is-hidden");
    document.getElementById('viewAnswer').classList.remove("viewedSolution");

    document.getElementById('score').classList.add("is-hidden");
    document.getElementById('answerID').innerHTML  =  "";
    document.getElementById('answerID').classList.add("is-hidden");
    document.getElementById('info').classList.add("is-hidden");
    document.getElementById('generateButton').classList.remove("is-transparent")
    // document.getElementById('generateButton').disabled=false;
}

function addFormatting(tokensArray){

    for (let i = 0; i < 5; i++) {
        var element=document.getElementById('result-word-'+(i+1));
        element.classList.add("is-hidden");
    }

    filterResultArray(tokensArray).map(([fullWord, prob,token,remainder, isYellow, isPurple],index) => {
        var element=document.getElementById('result-word-'+(index+1));
        element.classList.add("found-word");
        if(remainder>0){
            element.querySelector('.new-word').innerHTML = "<span>"+token+"</span>"
                                                          +"<span style='opacity: 0.5'>"+remainder+"</span>"
        } else {
           element.querySelector('.new-word').innerHTML = fullWord
        }
        element.querySelector('.result-bar').style.width = prob*100.0+'%'
        if(isYellow){
            element.classList.add("match-1");
            element.querySelector('.new-word').classList.add("match-1-text");
            element.querySelector('.result-bar').classList.add("match-1-bar");
        }
        if(isPurple){
            element.classList.add("match-2");
            element.querySelector('.new-word').classList.add("match-2-text");
            element.querySelector('.result-bar').classList.add("match-2-bar");
        }
    }
    )
    // for (let i = 0; i < 5; i++) {
    //     prob=100.0*tokensArray[i][1];
    //     var element=document.getElementById('result-word-'+(i+1))
    //     if(prob>=1){
    //         element.classList.add("found-word");
    //         if(tokensArray[i][3].length>0){
    //             element.querySelector('.new-word').innerHTML = "<span>"+tokensArray[i][2]+"</span>"
    //                                                           +"<span style='opacity: 0.5'>"+tokensArray[i][3]+"</span>"
    //         } else {
    //            element.querySelector('.new-word').innerHTML = tokensArray[i][0]
    //         }
    //         element.querySelector('.result-bar').style.width = prob+'%'
    //         if(tokensArray[i][4]){
    //             element.classList.add("match-1");
    //             element.querySelector('.new-word').classList.add("match-1-text");
    //             element.querySelector('.result-bar').classList.add("match-1-bar");
    //         }
    //         if(tokensArray[i][5]){
    //             element.classList.add("match-2");
    //             element.querySelector('.new-word').classList.add("match-2-text");
    //             element.querySelector('.result-bar').classList.add("match-2-bar");
    //         }

    //     } else {
    //         element.classList.add("is-hidden");
    //     }
        
    // }
    document.getElementById('attemptNumber').classList.remove("is-hidden");
    document.getElementById('leftButtonAnswer').classList.remove("is-hidden");
    document.getElementById('rightButtonAnswer').classList.remove("is-hidden");
    document.getElementById('attemptNumber').innerHTML="Attempt<br>"+attemptId+"/"+maxAttempts;
    if(attemptId>=parsedHistory.allAttempts.length){
        document.getElementById('rightButtonAnswer').classList.add("is-invisible");
    } else {
     document.getElementById('rightButtonAnswer').classList.remove("is-hidden","is-invisible");
    } 
    if(attemptId==1){
        document.getElementById('leftButtonAnswer').classList.add("is-invisible");
    } else {
        document.getElementById('leftButtonAnswer').classList.remove("is-hidden","is-invisible");
    }
    if(parsedHistory.attemptsRemaining<=0){
        document.getElementById('generateButton').classList.add("is-transparent")
        // document.getElementById('generateButton').disabled=true;
    }
}
function displayResults(animation=true,score){
    document.getElementById('results').style.display = 'block';
    const intv=500;
    // Simulate word predictions and score updates in the popup
    if(animation){
        var c=0
        for (let i = 0; i < 5; i++) {
            var element=document.getElementById('result-word-'+(i+1))
            if(element.classList.contains("found-word")){
                setTimeout(function() {
                    var element=document.getElementById('result-word-'+(i+1))
                    element.classList.remove("is-hidden");
                }, c*intv);
                c+=1
                }
        }
        setTimeout(function() {
            document.getElementById('stars').classList.remove("is-hidden");//style.display = 'block';
            document.getElementById('star-1').classList.add(getStars(score) >= 1 ? 'filled' : 'outline');
        }, c*intv);

        setTimeout(function() {
            document.getElementById('star-2').classList.add(getStars(score) >= 2 ? 'filled' : 'outline');
        }, (c+1)*intv);

        setTimeout(function() {
            document.getElementById('star-3').classList.add(getStars(score) >= 3 ? 'filled' : 'outline');
            document.getElementById('score').innerHTML="score: "+Math.round(score*100)+"["+Math.round(parsedHistory.bestScore*100)+"]";
            document.getElementById('score').classList.remove("is-hidden");
        }, (c+2)*intv);
        setTimeout(function() {
            document.getElementById('answerBox').classList.remove("is-hidden");
            updateStats()
            Array.from(document.getElementsByClassName("streakBox")).forEach(element => {element.classList.remove('is-invisible')});
        }, (c+4)*intv);

    } else {
        for (let i = 0; i < 5; i++) {
            var element = document.getElementById('result-word-'+(i+1));
            if(element.classList.contains("found-word")){
                element.classList.remove("is-hidden");
            }
        }
        document.getElementById('stars').classList.remove("is-hidden")//.style.display = 'block';
        document.getElementById('star-1').classList.add(getStars(score) >= 1 ? 'filled' : 'outline');
        document.getElementById('star-2').classList.add(getStars(score) >= 2 ? 'filled' : 'outline');
        document.getElementById('star-3').classList.add(getStars(score) >= 3 ? 'filled' : 'outline');
        document.getElementById('score').innerHTML="score: "+Math.round(score*100)+" ["+Math.round(parsedHistory.bestScore*100)+"]";//"score: "+Math.round(score*100)+"<br>"+"best: "+Math.round(parsedHistory.bestScore*100);
        document.getElementById('score').classList.remove("is-hidden");
        document.getElementById('answerBox').classList.remove("is-hidden");
        Array.from(document.getElementsByClassName("streakBox")).forEach(element => {element.classList.remove('is-invisible')});
        updateStats()
        
    }
}

function getStars(score){
    if(score<=0){
        return(0)
    } else if (score<0.65){
        return(1)
    } else if(score<0.85){
        return(2)
    } else {
        return(3)
    }
}

function getScore(prob1, prob2, pos, contextLength, k = 25, j = 0.2, desiredMaxLength = 5, lengthWeight = 0.1) {
    const scoreBase = 1 / (1 + Math.exp(-k * (prob2 - j)));
    const lengthAdj = Math.exp(-Math.max(contextLength - desiredMaxLength, 0) * lengthWeight);
    const positionScore = (6.0-pos)/4.0
    return Math.max(0,0.2*scoreBase*lengthAdj + 0.5*positionScore + 0.3*(prob1 + prob2));
}
function getScore_original(prob2, contextLength, k = 25, j = 0.2, desiredMaxLength = 5, lengthWeight = 0.1) {
    const scoreBase = 1 / (1 + Math.exp(-k * (prob2 - j)));
    return scoreBase * Math.exp(-Math.max(contextLength - desiredMaxLength, 0) * lengthWeight);
}
document.getElementById('generateButton').addEventListener('click', async () => {
    const inputText = document.getElementById('inputText').value;
    const outputDiv = document.getElementById('results');
    // const outputDiv2 = document.getElementById('output2');
    
    const scoreDiv = document.getElementById('scoreID');
    const target1 = document.getElementById('targetWord1').innerHTML;
    const target2 = document.getElementById('targetWord2').innerHTML;
    let x = 'c2stcHJvai1IUExHVGdPVHlOZlpNNldwSUViSXpKNGxXTXFnVXNfRzRJcXhGQ3p6SEx3NGJMOFozVUJsSFQ1S1JuLXpnMEdLN3BGaXY4Y2NRNFQzQmxia0ZKLVBfVFc3Y1lnTWFxb3BONlJKbWo2LXZjQkdwQWhtQ1RkX0dNRXBLeEI0MVZGNEpOcG01dnphc0pJb19nZ2tkTVpsNHNnZmJjSUE=';
    if (localStorage.getItem('userID')=="016f370d-3a8a-491a-9e45-c5c93cc5727e"){ //emily phone
        x = 'c2stcHJvai1DUTZqcGx2RV9GVUttX2swRy1HREFjWDZUMjRtMGdiUDBDN1RQSUt6STBSSlZzVmRqSUlKX3Y2TWVLVlRfUk56Q0NXOTRSWjk1UlQzQmxia0ZKSUx3VnRUZVJiQjBkUWJjajJUUHFLai0yWWF4R0l0cXJ1Nmd6QW1vcUdtTzF6cTEyMDdSenJWdEx6ZnVyVEctVmhuWjhYSnlFZ0E=';
    } else if(localStorage.getItem('userID')=="11a0d75a-56ee-4e5a-91d9-b1e2f8ea9e5a"){//jeremy phone
        x = 'c2stcHJvai1lYmVQZ3MwMlVMYVB2azBFVmNUTF9NNUVmcDhuVE41engzTEJxZnBBYUx5LWswNTlPTVBtMkRXNFZXVTdvSWZBYUtpbHZoQ3hVQVQzQmxia0ZKRXA2c3hvY1N3LTVtQXh5VlkyTWFwVW9WWm1wRXowSFJuT1lEUS1MM0FJajI5cjE0aWV0TWJBSE1qVkc0blNXeW9GVUpjWkpCZ0E=';
    }
    
    const chat_model = "gpt-4o-mini-2024-07-18";//'gpt-3.5-turbo';
    const instruct_model = 'gpt-3.5-turbo-instruct';
    const max_tokens = 10;//+document.getElementById('maxTokens').value;//3;
    const num_return= 10;//+document.getElementById('numReturn').value;//20;
    // const prefix= document.getElementById('prefix').value;//"continue this: ";
    // const model2 = document.getElementById('model2').value==='true';// true;
    clearFormatting();

    const system_instruction="Continue the sentence without repeating the prompt"
    const instruction_role="system"
    const role="user"
    // const system_instruction="Write me a sentence."
    // const instruction_role="user"
    // const role="assistant"
    async function getResponse(chattext,max_tokens,chat,num_logprobs=num_return,iteration=false,extra_message=""){
        
            let b = {
                max_tokens: max_tokens,
                temperature: 0
            }
            let f="";
            if (chat){
                f="chat/";
                b["model"]=chat_model;
                b["messages"]=[{"role": instruction_role,"content": `${system_instruction}`},
                 {"role": role,"content": `${chattext}`}];
                if(extra_message.length>0){
                    b["messages"][2]={"role": "assistant","content": `${extra_message}`}
                }
                if (num_logprobs>0){
                    b["logprobs"]=true;
                    b["top_logprobs"]=num_logprobs;
                }
                b["stop"]=[" ", ".", ","]
            } else {
                b["model"]=instruct_model;
                b["prompt"]=chattext+extra_message;
                if (num_logprobs>0){
                    b["logprobs"]=num_logprobs;
                }
            }   
            console.log(JSON.stringify(b))
            let response = await fetch(`https://api.openai.com/v1/${f}completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${atob(x)}`
                },
                body: JSON.stringify(b)
            });        
            const data = await response.json();
            console.log(data);
            let tokens =[];
            let first_content='';
            let first_token=0;
            if(chat){
                //const firstFollow = data.choices[0].message.content.trim();
                tokens = data.choices[0].logprobs.content[0].top_logprobs;
                tokens=tokens.map(item=>[item.token,item.logprob])
                first_content=data.choices[0].message.content;
            } else {
                tokens = Object.entries(data.choices[0].logprobs.top_logprobs[0]);
                first_content=data.choices[0].text;
                first_token=tokens.findIndex(subarray=>subarray[0]==data.choices[0].logprobs.tokens[0])
                data.choices[0].logprobs.tokens[0];
            }
            const tokensArray = [] ;
            for (const token in tokens) {
                //consider what happens if there is trailing space?
                let key = tokens[token][0];
                let keyt = key.trim().toLowerCase();
                const lp = Math.exp(tokens[token][1]);
                const idx_match = tokensArray.findIndex(subArray => subArray[0] === keyt);
                let content = '';
                if (token==first_token){
                    content=first_content;
                    if(iteration==false){
                        content = content.slice(key.length);
                    }
                }
                if(idx_match>=0){
                    let currentArray=tokensArray[idx_match];
                    currentArray[1]=currentArray[1]+lp;
                    tokensArray[idx_match]=currentArray;
                } else {
                    //if token is partial match, check if it is full match
                    
                    if((target1.startsWith(keyt) || target2.startsWith(keyt)) && !(keyt.startsWith(target1) || keyt.startsWith(target2)) && keyt.length>0 && iteration==false && content==''){
                        let [iteratedTokensArray,score,dbitem] = await getResponse(chattext+" "+keyt,max_tokens,chat,num_logprobs,true);//,extra_message=key
                        content=iteratedTokensArray[0][3]
                    }
                    word_content=content.split(' ')[0]
                    word=keyt+word_content
                    tokensArray.push([word,lp,keyt,word_content,word.startsWith(target1),word.startsWith(target2),key,content]);
                }
            }
            target1_idx=tokensArray.findIndex(row => row[4] === true);
            target2_idx=tokensArray.findIndex(row => row[5] === true);
            
            tokensArray.sort((a, b) => b[1] - a[1]);

            let score = 0;
            if (target1_idx==-1 || target2_idx==-1){
                score = 0;
            } else if(tokensArray[target1_idx][1]<0.01 || tokensArray[target2_idx][1]<0.01) {
                score = 0;
            } else {
                //score = Math.max(0,5-Math.max(target1_idx,target2_idx))
                prob1= Math.max(tokensArray[target1_idx][1],tokensArray[target2_idx][1])
                prob2= Math.min(tokensArray[target1_idx][1],tokensArray[target2_idx][1])
                console.log("score")
                console.log(prob1)
                console.log(prob2)
                console.log(Math.max(target1_idx,target2_idx)+1)
                score = getScore(prob1,prob2,Math.max(target1_idx,target2_idx)+1, 5);
            }

            let dbitem = {
                timestamp: Date.now(),
                userID: localStorage.getItem('userID'),
                sessionID: sessionStorage.getItem('sessionID'),
                device:navigator.userAgent.match(/\(([^)]+)\)/)[1],
                input: chattext,
                score: score,
                tokens: tokensArray.map(row => row[0]),
                probs: tokensArray.map(row => row[1]),
                tokens_orig: tokensArray.map(row => row[2]),
                continue: tokensArray.map(row => row[3]),
                target1_match: tokensArray.map(row => row[4]),
                target2_match: tokensArray.map(row => row[5]),
                parameters: {"max_tokens":max_tokens,
                    "num_return":num_return//,
                    // "minD":+document.getElementById('minD').value,
                    // "maxD":+document.getElementById('maxD').value
                },
                id: stale_id,
                todays_word_id: todaysDate,
                target1: target1,
                target2: target2,
                chat_model: chat
            }
            //db.collection("responses").add(dbitem)
            return([tokensArray,score,dbitem])
        }

    try{
        existing_answer=parsedHistory.allAttempts.findIndex(item => item.prompt == inputText );

        if(existing_answer>=0){
            // const attempt=parsedHistory.allAttempts[existing_answer];
            // let tokensArray = attempt.result;
            // let score = attempt.score;
            getHistory(selectedDate,type=existing_answer+1,targets=[],animation=true);
            console.log(parsedHistory.allAttempts.at(existing_answer).result)
        } else {
            let [tokensArray,score,dbitem] = await getResponse(inputText,max_tokens,true);
            parsedHistory.attemptsMade += 1;
            attemptId=parsedHistory.attemptsMade;
            if(parsedHistory.attemptsRemaining>0){
                if((parsedHistory.bestScore===null | score>parsedHistory.bestScore | parsedHistory.bestScore==0) ){
                    parsedHistory.bestScore=score
                    parsedHistory.bestPrompt=inputText;
                    parsedHistory.bestAttemptId=attemptId;
                    // scoreList[selectedDate]=score
                    // localStorage.setItem("scoreList", JSON.stringify(scoreList));
                }
                db.collection("responses").add(dbitem)
                parsedHistory.attemptsRemaining -=1;
                // updateStreak(score>0,selectedDate);
            } else {
                parsedHistory.attemptsRemaining -=1;
            }
            clearFormatting();
            addFormatting(tokensArray);
            displayResults(animation=true,score=score);
            parsedHistory.allAttempts.push(
                {
                prompt: inputText,
                sessionID: sessionStorage.getItem('sessionID'),
                result: tokensArray,
                score: score
                }
            )
            // attemptId+=1;
            localStorage.setItem(selectedDate, JSON.stringify(parsedHistory));
        }
        console.log(parsedHistory)
        //outputDiv.innerHTML  =  tokensArray.map(getFormattedText).join('\n');
        //scoreDiv.innerHTML  =  `Score: ${score}`;
        

        // if(model2){
        //     let [tokensArray2,score2,dbitem] = await getResponse(inputText,max_tokens,false);
        //     outputDiv2.innerHTML = tokensArray2.map(getFormattedText).join('\n');
        // }

    } catch (error) {
        console.log(error)
        document.getElementById("instructions").textContent = `Error: ${error.message}`;
    }
});

function filterResultArray(arr){
    return(arr.filter(([name, prob], index) => {
        return 100.0*prob >= 1 && index <5}
    ))
}
function generateShareString(attempt) {
    const squares= filterResultArray(attempt.result).map(([name, prob,a,b, isYellow, isPurple],index) => {
        const squares = Math.ceil(prob *10);
        const color = isPurple ? '🟪' : isYellow ? '🟨' : '⬜';
        return color.repeat(squares);
    }).join('\n');
    const stars=getStars(attempt.score)
    const starRating = '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
    const initialWordString = attempt.prompt.split(/[\s+ ,.!?;:]+/)
    .map(part => { return '_'.repeat(Math.ceil(part.length/2.0));}).join(' ')
    // const breakAt = initialWordString.lastIndexOf(' ', 25);
    const wordString = initialWordString//initialWordString.slice(0, breakAt) + "\n" + initialWordString.slice(breakAt + 1);
    const setupString = '🟨 = '+ document.getElementById('targetWord1').innerText + '  🟪 = ' + document.getElementById('targetWord2').innerText
    const finalString = `${setupString}\n${wordString}\n\n${squares}\n${starRating}`;
    return(finalString)
}

document.getElementById('shareAnswer').addEventListener('click', async () => {
    shareString=generateShareString(parsedHistory.allAttempts[attemptId-1])
    navigator.clipboard.writeText(shareString)
    showPopup()
});
function showPopup() {
    const popup = document.getElementById('popup');
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show'); 
    }, 2000);  // Popup will disappear after 2 seconds
}

// function updateStreak(starEarned,selectedDate) {
//     // const today = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format
//     const lastDate = localStorage.getItem('streakLastDate');
//     const yesterdaysDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
//     let currentStreak = parseInt(localStorage.getItem('streak') || '0');
//     let doUpdateStreak=true;
//     if((selectedDate!==todaysDate) || (lastDate==todaysDate) ){
//         doUpdateStreak=false;
//     } else if(lastDate === null || lastDate<yesterdaysDate){
//         currentStreak = 1;
//     } else if(starEarned==false & parsedHistory.attemptsRemaining==0){
//         currentStreak = 1;
//     } else if(starEarned & lastDate==yesterdaysDate){
//         currentStreak++;
//     } else {
//         doUpdateStreak=false;
//     }
//     if(doUpdateStreak){
//         localStorage.setItem('streak', currentStreak);
//         localStorage.setItem('streakLastDate', todaysDate);
//         localStorage.setItem('streakBest', Math.max(currentStreak,parseInt(localStorage.getItem('streakBest') || '0')));
//     }
// }

function longestStreak(arr) {
    let maxStreak = 0, currentStreak = 0;

    for (let num of arr) {
        if (num > 0) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    return maxStreak;
}
function getDatesBetween(startDate=minDate,endDate=todaysDate) {
    let dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}
function updateStats(){
    let scoresWithoutToday = getDatesBetween().map(key => JSON.parse(localStorage.getItem(key))?.bestScore??null).slice(0, -1);
    let scoresWithToday = scoresWithoutToday.slice()
    let todays_history=JSON.parse(localStorage.getItem(todaysDate));
    if(todays_history.attemptsRemaining==0 &&  todays_history.bestScore==0){
        scoresWithToday.push(0)
    } else if(todays_history.bestScore>0){
        scoresWithToday.push(todays_history.bestScore)
    }
    const streak=scoresWithToday.reverse().findIndex(score => score === 0 || score === null)
    const bestStreak=longestStreak(scoresWithToday)
    const starCounts=scoresWithToday.filter(score=>score!==null).map(value => getStars(value));

    document.getElementById('statTotal').innerText=scoresWithToday.filter(score=>score!==null).length;
    document.getElementById('statStreak').innerText=streak;
    document.getElementById('statBestStreak').innerText=bestStreak;
    document.getElementById('statStar1').innerText=starCounts.filter(num=>num==1).length
    document.getElementById('statStar2').innerText=starCounts.filter(num=>num==2).length
    document.getElementById('statStar3').innerText=starCounts.filter(num=>num==3).length
}
