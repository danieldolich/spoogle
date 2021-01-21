import React, { useState, useEffect, Fragment } from 'react';
import './../../styles.css';
import SearchResultRow from './SearchResultRow.jsx';
import SearchBar from './SearchBar.jsx'
import CachedResults from './CachedResults.jsx'
import querystring from 'query-string'
import Cookies from 'universal-cookie'

const cookies = new Cookies();
const App = () => {
  const [ results, setResults ] = useState([]);
  const [ favorites, setFavorites ] = useState([]);
  const [ deviceId, setDeviceId ] = useState(undefined);
  const [ spotifyPlayer, setSpotifyPlayer ] = useState(undefined);
  const [ token, setToken ] = useState(cookies.get('token'));
  const [ currentTrack, setCurrentTrack ] = useState(undefined);
  const [ isPlaying, setIsPlaying ] = useState(false);
  const [ cacheRender, setCacheRender] = useState([]);
  // ex) state: { results : [] }, if "setResults" method is invoked, the results arr
  // will be updated with elements

  // define a new hook result cache with state value of this hook with a method cache
  const [resultsCache, setResultsCache] = useState([]);
  
  

  // display previous results

  // basically component did mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new Spotify.Player({
        name: 'Spoogle',
        getOAuthToken: cb => { cb(token); }
      });

      setSpotifyPlayer(player);
    
      // Error handling
      player.addListener('initialization_error', ({ message }) => { console.error(message); });
      player.addListener('authentication_error', ({ message }) => { console.error(message); });
      player.addListener('account_error', ({ message }) => { console.error(message); });
      player.addListener('playback_error', ({ message }) => { console.error(message); });
    
      // Ready - Ready with Device ID
      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
      });
    
      // Not Ready - Device ID has gone offline
      player.addListener('not_ready', ({ device_id }) => {
        setDeviceId(undefined);
      });
    
      // Connect to the player!
      player.connect();
    };
  }, []);
  // ^ so atm it's just an empty array but it can be another func that can be invoked
  // and if invoked, will run useEffect again. 
  

  // user controls playing and pausing current song
  const togglePlay = (trackURI) => {
    if (trackURI !== currentTrack) {
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackURI] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })
        .then(() => {
          setCurrentTrack(trackURI);
          setIsPlaying(true);
        });
    } else if (isPlaying) {
      spotifyPlayer.pause().then(() => {
        setIsPlaying(false);
      });
    } else {
      spotifyPlayer.resume().then(() => {
        setIsPlaying(true);
      });
    }
  };
  // onclick to submit search of w/e parameters
  // results is an array of tracks
  const submitSearch = (state) => {
    console.log(state)
    if (!state.genreInput) return;
    const theQueryObj = { seed_genres: state.genreInput };
    for (let i = 0; i< state.values.length; i++) {
      if(state.searchParameters[i].spotifyName==='_tempo') {
        if(state.values[i][1] !== 220 || state.values[i][0] !== 0){
          theQueryObj[`min${state.searchParameters[i].spotifyName}`] = (state.values[i][0]);
          theQueryObj[`max${state.searchParameters[i].spotifyName}`] = (state.values[i][1]);
        }
      }
      else if(state.searchParameters[i].spotifyName==='_duration_ms'){
        if(state.values[i][1] !== 15 || state.values[i][0] !== 0){
          theQueryObj[`min${state.searchParameters[i].spotifyName}`] = (state.values[i][0]*60000);
          theQueryObj[`max${state.searchParameters[i].spotifyName}`] = (state.values[i][1]*60000);
        }
      }
      else if (state.searchParameters[i].spotifyName==='_popularity' ){
        theQueryObj[`min${state.searchParameters[i].spotifyName}`] = (state.values[i][0]);
        theQueryObj[`max${state.searchParameters[i].spotifyName}`] = (state.values[i][1]);
      }
      
      else if (state.values[i][1] !== 100 || state.values[i][0] !== 0) {
        theQueryObj[`min${state.searchParameters[i].spotifyName}`] = state.values[i][0]/100;
        theQueryObj[`max${state.searchParameters[i].spotifyName}`] = state.values[i][1]/100; 
      }
    }

    fetch('/apiSpot/rec?'+ querystring.stringify(theQueryObj))
      .then(data => data.json())
      .then(data => {
        console.log(data);
        // data is arr
        // make a shallow copy of w/e data is rn
        let previousCache = [...resultsCache];
        // previousCache = [];
        previousCache.push(data);
        

        //
        let previousCacheRender = [...cacheRender]
        previousCacheRender.push(<CachedResults data={data}/>)
        setCacheRender(previousCacheRender);
        // previousCache = [[{track1}, {track2}, etc...]]
        // resultsCache = [[{track1}, {track2}, etc...]]

        // Round 2
        // previousCache = [[{track1}, {track2}, etc...]]
        // previousCache = [[{newtrack1}, {newtrack2}], [{track1}, {track2}, etc...]]
        setResultsCache(previousCache);
        setResults(data);
        return data;
      })
      .then(data => {
        const authToken = cookies.get('token');
        const trackArr = data.map(track => track.id);
        const queryIds = trackArr.join();
        fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${queryIds}`, {
          headers: { 'Authorization': "Bearer " + authToken }
        })
        .then(data => data.json())
        .then(data => {
          console.log(trackArr.filter((track, i) => data[i]));
          setFavorites(trackArr.filter((track, i) => data[i]));
        })
      })
  }

  const toggleFavorite = (trackId, isFavorite) => {
    const authToken = cookies.get('token');
    if (isFavorite) {
      const copy = favorites.slice();
      for (let i = 0; i < copy.length; i++) {
        if (trackId === copy[i]) {
          copy.splice(i, 1);
          //delete request
          fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': "Bearer " + authToken,
              'content-type': 'application/json'
            }
          })
      .catch(err => console.log(err));
          break;
        }
      }
      setFavorites(copy);

    } else {
      //add request
      fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
        method: 'PUT',
        headers: {'Authorization': "Bearer " + authToken,
                  'content-type': 'application/json'
        }
      })
      .catch(err => console.log(err));
      setFavorites([...favorites, trackId]);
    }
  }

  const resultsRows = results.map((track, index) => (
    <SearchResultRow
      key={`searchResult${index}`}
      track={track}
      isPlaying={(track.uri === currentTrack) && isPlaying}
      togglePlay={togglePlay}
      favorites={favorites}
      toggleFavorite={toggleFavorite}
    />
  ));
  const login = []
  if (!cookies.get('token')) {
    login.push(<div className='LoginLink' ><a  href='http://localhost:3000/apiSpot/login'> Login to Spotify for playback</a></div>)
  }


  return (
    <Fragment key='appfragment'>
        {login}
     
        <img id="Spoogo" src="client/assets/logo.svg" />
        <h4>brought you by danger ramen 🍜</h4>
        <h4 className="result-stories">Your Saved Results</h4>
        <div className="stories-container">
        {cacheRender}
        </div>
        <SearchBar key='searchbar1' submitSearch={submitSearch} />
      <div className="results-grid">
        {resultsRows}
      </div>
    </Fragment>
  );
}

export default App;
