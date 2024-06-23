
// function get2RandomItems(count=2) {
//     const uniqueNumbers = new Set();

//     while (uniqueNumbers.size < count) {
//         const randomNumber = Math.floor(Math.random() * all_words.length);
//         uniqueNumbers.add(randomNumber);
//     }
//     out=[]
//     for(const v of uniqueNumbers){out.push(all_words[v])}
//     return(out)
// }
function setRandomWords(min,max) {
    let minI=all_words[2].findIndex((x)=>x>=min)
    let maxI=all_words[2].findIndex((x)=>x>max)
    if(maxI==-1){
        maxI=all_words[2].length
    }
    const selectedIndex = minI+Math.floor(Math.random() * (maxI-minI));

    out=[all_words[0][selectedIndex],all_words[1][selectedIndex],all_words[2][selectedIndex]]
    //for(const v of uniqueNumbers){out.push(all_words[v])}
    document.getElementById('targetWord1').textContent = out[0]
    document.getElementById('targetWord2').textContent = out[1]
    document.getElementById('difficulty').textContent = Math.round((out[2]*100))
    return(out)
}
// function update

setRandomWords(+document.getElementById('minD').value,+document.getElementById('maxD').value);

document.getElementById('refreshWords').addEventListener('click', async () => {
    setRandomWords(+document.getElementById('minD').value,+document.getElementById('maxD').value);
});

document.getElementById('generateButton').addEventListener('click', async () => {
    const inputText = document.getElementById('inputText').value;
    const outputDiv = document.getElementById('output');
    const outputDiv2 = document.getElementById('output2');
    const target1 = document.getElementById('targetWord1').value;
    const target2 = document.getElementById('targetWord2').value;

    const x = atob('c2stcHJvai0zZDN5MWo5TDRaYVljVG1oTllmNlQzQmxia0ZKZUJNalpUQXZWMnRKM0tYWVA5MkM=');
    const chat_model = 'gpt-3.5-turbo';
    const instruct_model = 'gpt-3.5-turbo-instruct';
    const maxTokens = +document.getElementById('maxTokens').value;//3;
    const num_return= +document.getElementById('num_return').value;//20;
    const prefix= document.getElementById('prefix').value;//"continue this: ";
    const model2 = document.getElementById('model2').value==='true';// true;

        async function getResponse(chattext,maxTokens,chat,num_logprobs=num_return,iteration=false){
            let b = {
                max_tokens: maxTokens,
                temperature: 0
            }
            let f="";
            if (chat){
                f="chat/";
                b["model"]=chat_model;
                b["messages"]=[{role: "user",content: `${prefix}${chattext}`}];
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
                let keyt = key.trim();
                const lp = Math.exp(tokens[token][1]);
                const idx_match = tokensArray.findIndex(subArray => subArray[0] === keyt);
                let content = '';
                console.log(token);
                console.log(first_token);
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
                        iteratedTokensArray = await getResponse(chattext+key,maxTokens,chat,num_logprobs,true);
                        content=iteratedTokensArray[0][3]
                        keyt=(keyt+content).split(' ')[0]
                    }
                    tokensArray.push([keyt,lp,key,content,keyt.startsWith(target1),keyt.startsWith(target2)]);
                }
            }
            tokensArray.sort((a, b) => b[1] - a[1]);
            return(tokensArray)
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
        const tokensArray = await getResponse(inputText,maxTokens,true);
        outputDiv.innerHTML  =  tokensArray.map(getFormattedText).join('\n');
        if(model2){
            const tokensArray2 = await getResponse(inputText,maxTokens,false);
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

