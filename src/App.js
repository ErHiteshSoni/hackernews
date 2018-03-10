import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import PropTypes from 'prop-types';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faSpinner from '@fortawesome/fontawesome-free-solid/faSpinner';
import faArrowUp from '@fortawesome/fontawesome-free-solid/faArrowUp';
import faArrowDown from '@fortawesome/fontawesome-free-solid/faArrowDown';
import { sortBy } from 'lodash';
import classNames from 'classnames';


const DEFAULT_HPP = '100';
const DEFAULT_QUERY = 'redux';
const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PAGE_NUM = "page=";
const PARAM_HPP = 'hitsPerPage=';

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
};

const updateSearchTopStoriesState = (hits, page) => (prevState) => {
  const { searchKey, results } = prevState;
  const oldHits = results && results[searchKey]
   ? results[searchKey].hits
   : [];
  const updatedHits = [
   ...oldHits,
   ...hits
  ];
  return {
    results: {
      ...results,
      [searchKey]: { hits: updatedHits, page }
    },
    isLoading: false
  };
};

class App extends Component {
  _isMounted = false;

  constructor(props){
    super(props);
    this.state = {
      desc: "Tech News",
      searchTerm: DEFAULT_QUERY,
      results: null,
      error: null,
      searchKey: "",
      isLoading: false,
    };
    this.onDismiss = this.onDismiss.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.setSearchResult = this.setSearchResult.bind(this);
    this.searchFunc = this.searchFunc.bind(this);
    this.fetchSearchStories = this.fetchSearchStories.bind(this);
  }

  needToFetchSearchStories(searchTerm){
    return !this.state.results[searchTerm];
  }

  fetchSearchStories(searchTerm, page = 0){
    this.setState({isLoading: true});
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PAGE_NUM}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
    .then(result => this._isMounted && this.setSearchResult(result.data))
    .catch(error => this._isMounted && this.setState({error: error}));
  }

  searchFunc(event){
    const{
      searchTerm
    } = this.state;

    this.setState({searchKey: searchTerm});
    if(this.needToFetchSearchStories(searchTerm)){
      this.fetchSearchStories(searchTerm);
    }
    event.preventDefault();
  }

  setSearchResult(result){
    const{
      hits, page
    } = result;

    this.setState(updateSearchTopStoriesState(hits, page));
   }

  componentDidMount(){
    this._isMounted = true;

    const{
      searchTerm
    } = this.state;

    this.setState({searchKey: searchTerm});
    this.fetchSearchStories(searchTerm);
  }

  handleChange(event){
    this.setState({searchTerm: event.target.value});
  }

  onDismiss(id) {
    const{
      searchKey, results
    } = this.state;
    const{
      hits, page
    } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    this.setState({
    results: {
      ...results,
      [searchKey]: {hits: updatedHits, page}
    }
    });
  }

  componentWillUnmount(){
    this._isMounted = false;
  }


  render() {
    const {
      searchTerm,
      results,
      searchKey,
      error,
      isLoading
    } = this.state;

    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;

    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];

    return (
      <div className="App">
        <h3>{this.state.desc}</h3>
        <div className="page">
          <div className="interactions">
            <Search searchTerm={searchTerm} onChange={this.handleChange} onSubmit={this.searchFunc}>
              Search
            </Search>
          </div>
          {error
             ? <p>Something Went Wrong!!</p>
             : <Form
               list={list}
               onDismiss={this.onDismiss}
              />
          }

          <div className="interactions">
            <ButtonWithLoading
              isLoading={isLoading}
              onClick={() => this.fetchSearchStories(searchKey, page+1)}>
              More...
            </ButtonWithLoading>
          </div>
        </div>
      </div>
    );
  }
}

class Search extends Component{
  componentDidMount(){
    if(this.input){
      this.input.focus();
    }
  }

  render(){
    const{
      searchTerm,
      children,
      onChange,
      onSubmit
    } = this.props;

    return(
      <form onSubmit={onSubmit}>
        <input type="text" onChange={onChange} value={searchTerm} ref={(node) => {this.input = node;}}/>
        <button type="submit">{children}</button>
      </form>
    );
  }
}

 class Form extends Component{
   constructor(props) {
     super(props);
     this.state = {
       sortKey: 'NONE',
       isSortReverse: false,
     };
     this.onSort = this.onSort.bind(this);
   }

   onSort(sortKey) {
     const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
     this.setState({ sortKey, isSortReverse });
   }

   render(){
     const {
       list,
       onDismiss
     } = this.props;

     const {
       sortKey,
       isSortReverse,
     } = this.state;

     const sortedList = SORTS[sortKey](list);
     const reverseSortedList = isSortReverse
     ? sortedList.reverse()
     : sortedList;

     return(
     <div className="table">
       <div className="table-header">
         <span style={{ width: '40%' }}>
           <Sort
           sortKey={'TITLE'}
           onSort={this.onSort}
           activeSortKey={sortKey}
           isSortReverse={isSortReverse}
           >
             Title
           </Sort>
         </span>
         <span style={{ width: '30%' }}>
           <Sort
           sortKey={'AUTHOR'}
           onSort={this.onSort}
           activeSortKey={sortKey}
           isSortReverse={isSortReverse}
           >
             Author
           </Sort>
         </span>
         <span style={{ width: '10%' }}>
           <Sort
           sortKey={'COMMENTS'}
           onSort={this.onSort}
           activeSortKey={sortKey}
           isSortReverse={isSortReverse}
           >
             Comments
           </Sort>
         </span>
         <span style={{ width: '10%' }}>
           <Sort
           sortKey={'POINTS'}
           onSort={this.onSort}
           activeSortKey={sortKey}
           isSortReverse={isSortReverse}
           >
             Points
           </Sort>
         </span>
         <span style={{ width: '10%' }}>
           Archive
         </span>
         </div>

      {reverseSortedList.map(item =>
           <div key={item.objectID} className="table-row">
             <span style={{ width: '40%' }}><a href={item.url}>{item.title} </a></span>
             <span style={{ width: '30%' }}>{item.author} </span>
             <span style={{ width: '10%' }}>{item.num_comments} </span>
             <span style={{ width: '10%' }}>{item.points} </span>
             <span style={{ width: '10%' }}>
               <Button onClick={() => onDismiss(item.objectID)} className="button-inline">
                 Dismiss
               </Button>
              </span>
           </div>
       )}
     </div>
     );
   }
 }

  Form.propTypes = {
    list: PropTypes.arrayOf(
      PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number,
      })
    ).isRequired,
    onDismiss: PropTypes.func,
  };

  const Sort = ({
    sortKey,
    activeSortKey,
    onSort,
    isSortReverse,
    children
  }) => {
    const sortClass = classNames(
      'button-inline',
      { 'button-active': sortKey === activeSortKey }
    );

    return (
      <Button
        onClick={() => onSort(sortKey)}
        className={sortClass}
      >
        {children}
        {
          sortKey === activeSortKey
           ? sortKey === 'COMMENTS' || sortKey === 'POINTS'
              ? !isSortReverse
                 ? <span> <FontAwesomeIcon icon={faArrowDown} /></span>
                 : <span> <FontAwesomeIcon icon={faArrowUp} /></span>
          : !isSortReverse
             ? <span> <FontAwesomeIcon icon={faArrowUp} /></span>
             : <span> <FontAwesomeIcon icon={faArrowDown} /></span>
          : <span></span>
        }
      </Button>
    );
  }

 const Button = ({onClick, children, className}) =>
  <button
    onClick={onClick}
    type="button"
    className={className}
    >
      {children}
  </button>

  Button.propTypes = {
    onClick: PropTypes.func,
    className: PropTypes.string,
    children: PropTypes.node,
  };

  Button.defaultProps = {
    className: '',
  };

const Loading = () => <div><FontAwesomeIcon icon={faSpinner} pulse size="2x"/></div>

const withLoading = (Component) => ({isLoading, ...rest}) =>
  isLoading
  ? <Loading />
  : <Component {...rest} />

const ButtonWithLoading = withLoading(Button);

export default App;

export{
  Button,
  Search,
  Form
};
