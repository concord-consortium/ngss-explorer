import React from 'react';
import './App.css';
import NGSS from './ngss';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams
} from "react-router-dom";

function ItemLink(props) {
  let id = props.uri.match(/.*\/([^/]*)$/)[1];
  return (
    <Link to={`/item/${id}`}>{props.children ? props.children : id}</Link>
  );
}

function getText(obj, key) {
  let rawValue = obj[key];
  if(rawValue) {
    return rawValue.map((item) => item.value).join(' ');
  }
  return null;
}

function getValue(obj, key) {
  let rawValue = obj[key];
  if(rawValue) {
    return rawValue[0].value;
  }
  return null;
}

function Item(props) {
  let description = getText(props.value, "http://purl.org/dc/terms/description");
  let statementNotation = getText(props.value, "http://purl.org/ASN/schema/core/statementNotation");
  let statementLabel = getText(props.value, "http://purl.org/ASN/schema/core/statementLabel");
  let children = props.value["http://purl.org/gem/qualifiers/hasChild"];
  let comprisedOf = props.value["http://purl.org/ASN/schema/core/comprisedOf"];
  let parents = props.value["http://purl.org/gem/qualifiers/isChildOf"];

  return (
    <dl>
      <dt>ID</dt>
      <dd><ItemLink uri={props.uri}/></dd>

      <dt>URI</dt>
      <dd>{props.uri}</dd>

      { description && <>
        <dt>Description</dt>
        <dd>{description}</dd>
      </> }

      { statementNotation && <>
        <dt>Statement Notation</dt>
        <dd>{statementNotation}</dd>
      </> }

      { statementLabel && <>
        <dt>Statement Label</dt>
        <dd>{statementLabel}</dd>
      </> }

      { children && <>
        <dt>Children</dt>
        <dd><ItemList list={children}/></dd>
      </> }

      { comprisedOf && <>
        <dt>Comprised of</dt>
        <dd><ItemList list={comprisedOf}/></dd>
      </> }

      { parents && <>
        <dt>Parents</dt>
        <dd><ItemList list={parents}/></dd>
      </> }

      <hr/>
    </dl>
  );
}

function getType(item) {
  // To identify a practice need to go up the parents until the
  // "http://purl.org/dc/terms/isPartOf" matches the parent
  // If the description is "Science and Engineering Practices" then this is a practice
  let partOf = getValue(item,"http://purl.org/dc/terms/isPartOf");
  if(!partOf) {
    // if it doesn't have a isPartOf it is the top level document
    return "Document";
  }

  let statementLabel = getText(item, "http://purl.org/ASN/schema/core/statementLabel");
  if(statementLabel) {
    return statementLabel;
  }

  let topParent = null;
  let childOf = getValue(item,"http://purl.org/gem/qualifiers/isChildOf");
  while(childOf != partOf){
    topParent = NGSS[childOf];
    childOf = getValue(topParent,"http://purl.org/gem/qualifiers/isChildOf");
  }
  if(topParent) {
    let topParentDescription = getText(topParent, "http://purl.org/dc/terms/description");
    if(topParentDescription == "Science and Engineering Practices"){
      return "Practice";
    }
    if(topParentDescription == "Crosscutting Concepts"){
      return "Crosscutting Concept";
    }
    if(topParentDescription == "Disciplinary Core Ideas"){
      return "Disciplinary Core Idea";
    }
  }

  return null;
}

function ItemSummary(props) {
  let description = getText(props.value, "http://purl.org/dc/terms/description");
  let statementNotation = getText(props.value, "http://purl.org/ASN/schema/core/statementNotation");
  let type = getType(props.value);
  return (
    <div>
      <ItemLink uri={props.uri}/>
      {type &&
        <b>&nbsp;{type}</b>
      }
      {statementNotation &&
        <b>&nbsp;{statementNotation}</b>
      }
      &nbsp;{description}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/item/:itemId">
            <ItemPage />
          </Route>
          <Route path="/">
            <Index />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function ItemList(props) {
  // TODO check that eacy item has a type of 'uri'
  return (
    <ul>
      { props.list.map((item) =>
        <li key={item.value}>
          <ItemSummary uri={item.value} value={NGSS[item.value]}/>
        </li>
      ) }
    </ul>
  )
}

function Index() {
  return (
    <div>
      <p>
        Length {Object.keys(NGSS).length}
      </p>
      { Object.entries(NGSS).map((entry) =>
          <ItemSummary uri={entry[0]} value={entry[1]}/>
      ) }
    </div>
  );
}

function ItemPage() {
  let { itemId } = useParams();
  let uri = `http://asn.jesandco.org/resources/${itemId}`

  // TODO add a 'back to index link'
  return (
    <Item uri={uri} value={NGSS[uri]}/>
  )
}

export default App;
