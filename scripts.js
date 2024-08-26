
if (!localStorage.getItem('userID')) {
    // Set the value if it doesn't exist
    localStorage.setItem('userID', uuid.v4());
}
if (!sessionStorage.getItem('sessionID')) {
    // Set the value if it doesn't exist
    sessionStorage.setItem('sessionID', uuid.v4());
}

document.getElementById('showParams').addEventListener('change', function() {
    var toggleElement = document.getElementById('params');
    if (this.checked) {
        toggleElement.style.display = 'flex';
    } else {
        toggleElement.style.display = 'none';
    }
})
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
todaysDate = new Intl.DateTimeFormat('en-CA').format(new Date());
stale_id=""

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
    document.getElementById('difficulty').value = Math.round((out[2]*100))
    return(out)
}

async function getTodaysWords(env="TEST"){
    todaysDate = new Intl.DateTimeFormat('en-CA').format(new Date());
    // const referenceDate = new Date('2024-08-20'); 
    // Convert the time difference from milliseconds to days
    //const dayDifference = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));
    const docRef = db.collection("/targets/"+env+"/todays_word/").doc(todaysDate)

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
            chosen_item=await db.collection(collection).limit(1).get()
            if(chosen_item.size==0){
                console.log("No items found")
            }
        }
        data=chosen_item.docs[0].data()
        docId=chosen_item.docs[0].id;
        data.user_count=data.user_count+1;
        data.stale=true;
        data.date=todaysDate;
        await db.collection("/targets/"+env+"/stale_items").doc(docId).set(data);
        await db.collection(collection).doc(docId).delete();;
        todays_word_item={};
        todays_word_item.collection="/targets/"+env+"/stale_items"
        todays_word_item.date=new Date();
        todays_word_item.id=docId
        await docRef.set(todays_word_item);
    }

        document.getElementById('targetWord1').value = data.target1.trim();
        document.getElementById('targetWord2').value = data.target2.trim();
        document.getElementById('difficulty').value =  data.difficulty;
        answer = data.answer;
        stale_id=docId;
}


// function update

//setRandomWords(+document.getElementById('minD').value,+document.getElementById('maxD').value);
getTodaysWords();

// document.getElementById('refreshWords').addEventListener('click', async () => {
//     setRandomWords(+document.getElementById('minD').value,+document.getElementById('maxD').value);
// });

document.getElementById('viewAnswer').addEventListener('click', async () => {
    answerId=document.getElementById('answerID');
    answerId.innerHTML  =  `Possible answer: ${answer}`;
});
async function updateDocument(collectionName, documentId, updatedData) {
    try {
      const docRef = db.collection(collectionName).doc(documentId);
      await docRef.update(updatedData);
      console.log("Document successfully updated!");
    } catch (error) {
      console.error("Error updating document:", error);
    }
  }

document.getElementById('generateButton').addEventListener('click', async () => {
    const inputText = document.getElementById('inputText').value;
    const outputDiv = document.getElementById('output');
    const outputDiv2 = document.getElementById('output2');
    const scoreDiv = document.getElementById('scoreID');
    const target1 = document.getElementById('targetWord1').value;
    const target2 = document.getElementById('targetWord2').value;

    const x = atob('c2stcHJvai0zZDN5MWo5TDRaYVljVG1oTllmNlQzQmxia0ZKZUJNalpUQXZWMnRKM0tYWVA5MkM=');
    const chat_model = 'gpt-3.5-turbo';
    const instruct_model = 'gpt-3.5-turbo-instruct';
    const max_tokens = +document.getElementById('maxTokens').value;//3;
    const num_return= +document.getElementById('numReturn').value;//20;
    // const prefix= document.getElementById('prefix').value;//"continue this: ";
    const model2 = document.getElementById('model2').value==='true';// true;

        async function getResponse(chattext,max_tokens,chat,num_logprobs=num_return,iteration=false){
            let b = {
                max_tokens: max_tokens,
                temperature: 0
            }
            let f="";
            if (chat){
                f="chat/";
                b["model"]=chat_model;
                b["messages"]=[{role: "assistant",content: `${chattext}`}];
                if (num_logprobs>0){
                    b["logprobs"]=true;
                    b["top_logprobs"]=num_logprobs;
                }
            } else {
                b["model"]=instruct_model;
                b["prompt"]=chattext
                if (num_logprobs>0){
                    b["logprobs"]=num_logprobs;
                }
            }   
            let response = await fetch(`https://api.openai.com/v1/${f}completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${x}`
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
                }
                if(idx_match>=0){
                    let currentArray=tokensArray[idx_match];
                    currentArray[1]=currentArray[1]+lp;
                    tokensArray[idx_match]=currentArray;
                } else {
                    //if token is partial match, check if it is full match
                    
                    if((target1.startsWith(keyt) || target2.startsWith(keyt)) && !(keyt.startsWith(target1) || keyt.startsWith(target2)) && keyt.length>0 && iteration==false){
                        let [iteratedTokensArray,score] = await getResponse(chattext+key,max_tokens,chat,num_logprobs,true);
                        content=iteratedTokensArray[0][3]
                        keyt=(keyt+content).split(' ')[0]
                    }
                    tokensArray.push([keyt,lp,key,content,keyt.startsWith(target1),keyt.startsWith(target2)]);
                }
            }
            target1_idx=tokensArray.findIndex(row => row[4] === true);
            target2_idx=tokensArray.findIndex(row => row[5] === true);
            let score=0
            if (target1_idx==-1 || target2_idx==-1){
                score=0
            } else {
                score = Math.max(0,5-Math.max(target1_idx,target2_idx))
            }

            tokensArray.sort((a, b) => b[1] - a[1]);
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
                    "num_return":num_return,
                    "minD":+document.getElementById('minD').value,
                    "maxD":+document.getElementById('maxD').value},
                id: stale_id,
                todays_word_id: todaysDate,
                target1: target1,
                target2: target2,
                chat_model: chat
            }
            db.collection("responses").add(dbitem)
            return([tokensArray,score])
        }

        function getFormattedText([key, value,a,b,c,d]){
            let extra = ""
            if (b.length>0){
                extra=` (${b.trim()})`
            }
            const text = `${key} <span class="small">${(value*100).toFixed(1)}${extra}</span>`;
            if(c){
                return `<span class="highlight1">${text}</span>`;
            }
            if(d){
                return `<span class="highlight2">${text}</span>`;
            }
            else return `${text}`;
        }
    try{
        let [tokensArray,score] = await getResponse(inputText,max_tokens,true);
        outputDiv.innerHTML  =  tokensArray.map(getFormattedText).join('\n');
        scoreDiv.innerHTML  =  `Score: ${score}`;
        if(model2){
            let [tokensArray2,score2] = await getResponse(inputText,max_tokens,false);
            outputDiv2.innerHTML = tokensArray2.map(getFormattedText).join('\n');

        }

        if (true) {
            
        } else {
            outputDiv.textContent = `Error: ${data.error.message}`;
        }
    } catch (error) {
        outputDiv.textContent = `Error: ${error.message}`;
    }
});

