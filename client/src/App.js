import './App.css';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Landing from './components/Landing';
import ChatRoom from './components/ChatRoom';


function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/" component={Landing} />
          <Route path="/room/:name" component={ChatRoom} />
        </Switch>
      </Router>
      
    </div>
  );
}

export default App;
