import React, {Component, Fragment} from 'react';
import ReactDOM from 'react-dom';
import Filters from './Filters.jsx'
import querystring from 'query-string'
import GenreDrop from './GenreDropdown.jsx'

class SearchBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      genreInput: '',
      defaultValues: [[0,100],[0,100],[0,220],[0,100],[0,100],[0,15]],
      values: [[0,100],[0,100],[0,220],[0,100],[0,100],[0,15]],
      searchParameters : [ 
        {spotifyName: "_danceability", displayName: "Danceability",description: "A little side-step or in the mood to salsa?",min: 0,max: 100,},
        {spotifyName: "_acousticness",displayName: "Acousticness",description: "Coffee shop vibes or a raging concert?",min: 0,max: 100,},
        {spotifyName: "_tempo", displayName: "Tempo",description: "Still your heart or get the adrenaline pumping?",min: 0,max: 220,},
        {spotifyName: "_valence", displayName: "Valence",description: "Down in the dumps or feeling euphoric?",min: 0,max: 100,},
        {spotifyName: "_popularity", displayName: "Popularity",description: "Explore new artists or in with the radio tunes?",min: 0,max: 100,},
        {spotifyName: "_duration_ms", displayName: "Duration",description: "Just a quickie or a marathon?",min: 0,max: 15,}
      ]
    }
    this.handleChange = this.handleChange.bind(this);
    this.genreInputHandler = this.genreInputHandler.bind(this);
    this.handleReset = this.handleReset.bind(this);
  };

   handleReset() {
 
    const values = [...this.state.defaultValues];

    this.setState({...this.state, values});

  };

   handleChange(id, value) {
    const newValues = this.state.values;
    newValues[id]=value;
    this.setState({...this.state, values:newValues});
  };

  genreInputHandler(e)  {
    let newInput;
    if (e.target) newInput = e.target.value;
    else newInput = e;
    return this.setState({...this.state, genreInput: newInput});
  }

  render() {
    const sliders = [];
    // Rules:
    // state can be changed in the filters.jsx but not here?
    // 
    for (let i = 0; i < this.state.searchParameters.length; i += 1) {
      // only passing down 2 things to filter which are the param values - aka we'll know what the mins and maxes are 
      // the stuff of that the user actually affects is the this.state.values
      sliders.push(<Filters key={'slider'+i} id={i} parameterObj={this.state.searchParameters[i]} values={this.state.values[i]} onChangeFunc={this.handleChange} />);
    }

    return (
      <Fragment>
        <div className='searchbar'>
        <GenreDrop onChangeFunc={this.genreInputHandler} />
        </div>
        <div className="searchParams">
        {/* each "slider" contains key, id, param obj and also a mini reset button */}
        {sliders}
        </div>
        <button className='theSpoogle' onClick={() => { this.props.submitSearch(this.state) }} >Let's SPOOGLE it!</button> 
      </Fragment>
    )
  }
}

export default SearchBar;