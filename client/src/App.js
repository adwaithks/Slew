import './App.css';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Landing from './components/Landing';
import ChatRoom from './components/ChatRoom';
import Auth from './components/Auth';


function App() {



  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/" component={Auth} />
          <Route exact path="/create" component={Landing} />
          <Route exact path="/room/:name" component={ChatRoom} />
        </Switch>
      </Router>
      
    </div>
  );
}

export default App;
