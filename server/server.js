const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

const server = app.listen(port, ()=>{
    console.log(`Server listening to port ${port}`);
});

const io = require('socket.io')(server);

io.on('connection', socket=>{
    console.log(`Client connected: ${socket.id}`);

    ClientWords.changeClientWord(socket.id);
    
    socket.on('GetRandomWord', ()=>{
        io.emit('SendRandomWord', getRandomWord());
    });
    socket.on('GetWordState', word=>{
        const isValid = wordList.includes(word);

        const clientAnswerWord = ClientWords.list[socket.id];

        const state = word.split('').map((letter, i)=>{
            if(clientAnswerWord[i] == letter){
                return 'correct';
            }
            else if(clientAnswerWord.includes(letter)){
                return 'almost';
            }
            return 'incorrect';
        });

        socket.emit('SendWordState', {isValid, state});
    });
    socket.on('GetAnswerWord', ()=>{
        io.emit('SendAnswerWord', ClientWords.list[socket.id]);
    });

    socket.on('disconnect', ()=>{
        ClientWords.deleteClient(socket.id);
    });
});

const wordList = fs.readFileSync('five-letter-words.txt', 'utf8').split('\n');

function getRandomWord(){
    return wordList[Math.floor(Math.random() * wordList.length)];
}

class ClientWords{
    static list = {}
    static changeClientWord(socketId, word=getRandomWord()){
        this.list[socketId] = word;
    }
    static deleteClient(socketId){
        delete this.list[socketId];
    }
}