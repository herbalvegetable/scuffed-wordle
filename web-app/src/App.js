import React from 'react';
import './App.css';
import io from 'socket.io-client';
import replayIcon from './replay.svg';

class WordGrid extends React.Component{
	constructor(props){
		super(props);
	}
	render(){
		return (
			<div className='word-grid'>

				{
					[...Array(6).keys()].map(i=>{
						// console.log(this.props.wordList[i].state);
						return (
							<div key={`${i}`} className='letter-row'>
								{
									[...Array(5).keys()].map(j=>{
										let letter = this.props.wordList[i].word[j];
										return <div key={`${j}`} className={`letter ${this.props.wordList[i].state.length > 0 ? this.props.wordList[i].state[j] : letter != ' ' ? 'filled' : ''}`}>{letter}</div>
									})
								}
							</div>
						);
					})
				}

			</div>
		);
	}
}

class WordInput extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			inputValue: '',
		}

		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
	}
	handleSubmit(e){
		e.preventDefault();
		
		this.props.getWordState(this.state.inputValue);
	}
	handleInputChange(e){
		if(/[^a-zA-Z]+/g.test(e.target.value))return;
		let inputValue = e.target.value.substring(0, 5);
		this.setState({inputValue: inputValue});

		this.props.editWord(inputValue);
	}
	render(){
		return (
			<form onSubmit={this.handleSubmit}>
				<input className='word-input' type='text' spellCheck='false' placeholder='Guess' value={this.state.inputValue} onChange={e=>{
					this.handleInputChange(e);
				}}/>
			</form>
		);
	}
}

class App extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			wordList: [
				{
					word: '      ',
					state: [],
				},
				{
					word: '      ',
					state: [],
				},
				{
					word: '      ',
					state: [],
				},
				{
					word: '      ',
					state: [],
				},
				{
					word: '      ',
					state: [],
				},
				{
					word: '      ',
					state: [],
				},
			],
			answerWord: '',
			guessIndex: 0,
			finished: false,
			socket: null,
		}
		this.WordInput = React.createRef();
		this.editWord = this.editWord.bind(this);
		this.getWordState = this.getWordState.bind(this);
	}
	componentDidMount(){
		const newSocket = io('http://192.168.10.139:5000/', { transports: ["websocket"] });
		this.setState({socket: newSocket}, ()=>{
			this.state.socket.on('connect', ()=>{

				this.state.socket.on('SendWordState', data=>{
					const {isValid, state: wordState} = data;

					if(!isValid) return;

					let newWordList = [...this.state.wordList];
					newWordList[this.state.guessIndex].state = wordState;

					this.setState({
						wordList: newWordList,
						guessIndex: ++this.state.guessIndex,
					});
					this.WordInput.current.setState({inputValue: ''});

					if(this.state.guessIndex > 5){
						this.setState({finished: true});
						this.state.socket.emit('GetAnswerWord');
					}
				});
				
				this.state.socket.on('SendAnswerWord', answerWord=>{
					this.setState({answerWord: answerWord});
				});
			});
		});
	}
	componentWillUnmount(){
		this.state.socket.close();
	}
	getWordState(guessWord){
		if(this.state.guessIndex > 5) return;
		this.state.socket.emit('GetWordState', guessWord);
	}
	editWord(inputValue){
		if(this.state.guessIndex > 5) return;
		let newWordList = [...this.state.wordList];
		newWordList[this.state.guessIndex].word = `${inputValue.toUpperCase()}      `.substring(0, 5);
		this.setState({wordList: newWordList});
	}
	render(){
		return (
			<div className="App">
				<div className='App-header'>
					<h3>SCUFFED WORDLE</h3>
				</div>
				{
					this.state.answerWord ? 
					
					<div className='answer-reveal'>{this.state.answerWord.toUpperCase()}</div>

					: null
				}
				<WordGrid wordList={this.state.wordList}/>
				<WordInput editWord={this.editWord} getWordState={this.getWordState} ref={this.WordInput}/>
			</div>
		);
	}
}

export default App;
