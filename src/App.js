import React, { useReducer, useState, useRef } from 'react';
import './App.css';
import * as mobilenet from '@tensorflow-models/mobilenet'

const stateMachine = { 
  initial: 'initial',
  states: {
    initial: { on: { next: 'loadingModel' } },
    loadingModel: { on: { next: 'awaitingUpload' } },
    awaitingUpload: { on: { next: 'ready' } },
    ready: { on: { next: 'classifying' }, showImage: true },
    classifying: { on: { next: 'complete' } },
    complete: { on: { next: 'awaitingUpload' }, showImage: true, showResults: true }
  }
}

const reducer = (currentState, event) => stateMachine.states[currentState].on[event] || stateMachine.initial;

const formatResults = ({ className, probability }) => (
	<li key={className}>
		{`${className}: %${(probability * 100).toFixed(2)}`}
	</li>
);

function App () {

	const [state, dispatch] = useReducer(reducer, stateMachine.initial);
	const [model, setModel] = useState(null);
	const [imageUrl, setImageUrl] = useState(null);
	const [results, setResults] = useState([]);
	const inputRef = useRef();
	const imageRef = useRef();

	const next = () => dispatch("next");

	const loadModel = async () => {
		next();
		const mobilenetModel = await mobilenet.load();
		setModel(mobilenetModel)
		next();
	}

	const handleUpload = e => {
		const { files } = e.target;
		if (files.length > 0) {
			const url = URL.createObjectURL(files[0]);
			setImageUrl(url);
			next();
		}
	}

	const identify = async () => {
		next();
		const results = await model.classify(imageRef.current);
		setResults(results);
		next();
	}

	const reset = async () => {
		setResults([]);
		setImageUrl(null);
		next();
	}

	const buttonProps = {
		initial: { text: 'Load Model', action: loadModel },
		loadingModel: { text: 'Loading Model...', action: () => {} },
		awaitingUpload: { text: 'Load Photo', action: () => inputRef.current.click() },
		ready: { text: 'Identify', action: identify },
		classifying: { text: 'Identifying', action: () => {} },
		complete: { text: 'Reset', action: reset }
	}

	const { showImage = false, showResults = false } = stateMachine.states[state];

	return (
		<div>
			{showImage && <img alt="upload-preview" src={imageUrl} ref={imageRef}/>}
			{showResults &&
				<ul>
					{results.map(formatResults)}
				</ul>
			}
			<input type="file" accept="image/*" capture="camera" ref={inputRef} onChange={handleUpload} />
			<button onClick={buttonProps[state].action}>{buttonProps[state].text}</button>
		</div>
	);
}
export default App;