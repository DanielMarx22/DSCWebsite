import logo from './logo.svg';
import './App.css';
import Button from "./Components/Button"; 
import Card from './Components/Card';

function App() {
  return (
    <div ClassName = "card-container">
      <Card cardName = {"Card 1"} description = {"Description 1"}/>
      <Card cardName = {"Card 2"} description = {"Description 2"}/>
      <Card cardName = {"Card 3"} description = {"Description 3"}/>
    </div> 
  ); 
}

export default App;
