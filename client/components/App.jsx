import React, { useState, useEffect, Fragment } from 'react';
import './../../styles.css';
import SearchResultRow from './SearchResultRow.jsx';
import SearchBar from './SearchBar.jsx';
import querystring from 'query-string';
import Cookies from 'universal-cookie';
import styled from 'styled-components';
import CachedResults from './CachedResults.jsx'
import Popover from '@material-ui/core/Popover';


const cookies = new Cookies();

const App = () => {
  const [ results, setResults ] = useState([]);
  const [ favorites, setFavorites ] = useState([]);
  const [ deviceId, setDeviceId ] = useState(undefined);
  const [ spotifyPlayer, setSpotifyPlayer ] = useState(undefined);
  const [ token, setToken ] = useState(cookies.get('token'));
  const [ currentTrack, setCurrentTrack ] = useState(undefined);
  const [ isPlaying, setIsPlaying ] = useState(false);
  const [hidePlaylists, setHidePlaylists] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [trackURI, setTrackURI] = useState('');
  const [ cacheRender, setCacheRender] = useState([]);
  const [popoverRender, setPopoverValue] = useState(undefined);

  
  const [isPopoverOpen, setPopover] = useState(false);
  // ex) state: { results : [] }, if "setResults" method is invoked, the results arr
  // will be updated with elements

  // define a new hook result cache with state value of this hook with a method cache
  const [cacheOfPreviousTracks, setCacheOfPreviousTracks] = useState([]);
  
  

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

  const getPlaylists = (e, trackURI) => {
    if (hidePlaylists) {
      setHidePlaylists(false);
      setTrackURI(trackURI);
      //Get a list of the current user's playlists
      const authToken = cookies.get('token');
      fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {'Authorization': "Bearer " + authToken}
      })
      .then(data => data.json())
      .then(data => {
        console.log(data);
        setPlaylists(data.items); 
      })
      .catch(err => console.log(err));
    } else setHidePlaylists(true);
  }

  const handlePlaylistSubmit = (e) => {
    e.preventDefault();
    setHidePlaylists(true);
    const selectedIndex = e.target['0'].options.selectedIndex;
    const authToken = cookies.get('token');
    fetch(`https://api.spotify.com/v1/playlists/${playlists[selectedIndex].id}/tracks?uris=${trackURI}`, {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
    })
    .catch(err => console.log(err));
  };

  // onclick to submit search of w/e parameters
  // results is an array of tracks
  const submitSearch = (state) => {
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
        
        // data is arr
        // make a shallow copy of w/e data is rn
        let previousCache = [...cacheOfPreviousTracks];  //previous search array of tracks
        let previousCacheRender = [...cacheRender]; // previous rendered components album cover  

        previousCache.push(data); //add new data to our 
        

        //
        
          //these are the little alb cover components
        


        // previousCache = [[{track1}, {track2}, etc...]]
        // resultsCache = [[{track1}, {track2}, etc...]]

        // Round 2
        // previousCache = [[{track1}, {track2}, etc...]]
        // previousCache = [[{newtrack1}, {newtrack2}], [{track1}, {track2}, etc...]]

      
        // this is where all the state updates should be happening
        console.log("_________________")
        console.log(previousCache);
        setCacheOfPreviousTracks(previousCache);
        console.log('storage state below');
        console.log(cacheOfPreviousTracks);
        console.log("_________________")


        setResults(data); //original search render
        setCacheRender(previousCacheRender); //sets the new state of the added album cover
      
        previousCacheRender.push(<CachedResults clickedPopover = {clickPopover} index={cacheOfPreviousTracks} data={data}/>)

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
      getPlaylists={getPlaylists}
      hidePlaylists={hidePlaylists}
    />

  ));
  const login = []
  if (!cookies.get('token')) {
    login.push(<div className='LoginLink' ><a  href='http://localhost:3000/apiSpot/login'> Login to Spotify for playback</a></div>)
  }

  
 
  const clickPopover = ((info) => {
console.log('here')    
    let cachedRows = info.map((track, index) => (
      <SearchResultRow
      key={`searchResult${index}`}
      track={track}
      isPlaying={(track.uri === currentTrack) && isPlaying}
      togglePlay={togglePlay}
      favorites={favorites}
      toggleFavorite={toggleFavorite}
      getPlaylists={getPlaylists}
      hidePlaylists={hidePlaylists}
    />
    ))
    console.log('hello')    
    setPopoverValue(cachedRows);
    setPopover(true);
  })

  const clostPopOver = () => {
    setPopover(false)
  }



  return (
    <Fragment key='appfragment'>
        {login}
        <Popover
          open = {isPopoverOpen} 
          onClick = {clostPopOver}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'center',
          }}
        >
          {popoverRender}
        </Popover>
  

        <img id="Spoogo" src="client/assets/logo.svg" />
        <h4>brought you by danger ramen 🍜</h4>
        <h4 className="result-stories">Your Saved Results</h4>
        <div className="stories-container">
        {cacheRender}
        </div>
        <SearchBar key='searchbar1' submitSearch={submitSearch} />
        <PlaylistDisplay hidden={hidePlaylists}>
          <Form onSubmit={(e) => handlePlaylistSubmit(e)}>
            <UserPlaylists>
              {playlists.map(pl => (
                <Playlists key={pl.name} id={pl.id}>{pl.name}</Playlists>
              ))};
            </UserPlaylists>
              <PlaylistButton type='submit' value='Add to playlist' />
          </Form>
        </PlaylistDisplay>
      <div className="results-grid">
        {resultsRows}
      </div>
    </Fragment>
  );
}

export default App;


//styled components

const PlaylistDisplay = styled.div `
  position: fixed;
  top: 50%;
  left: 50%;
  height: 3rem;
  width: fit-content;
  border: 2px solid #4285F4;
  background-color: white;
  padding: 18px;
  z-index: 2;
  display: ${props => props.hidden ? 'none' : 'flex'};
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 3px 3px 3px darkgrey;
  border-radius: 2em;
`;

//options in the drop down
const Playlists = styled.option`
  width: fit-content;
`;

//creates a drop down list
const UserPlaylists = styled.select` 
  width: 9rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const PlaylistButton = styled.input`
  font-family: sans-serif;
  background-color: white;
  border-color: #4285F4;
  &:hover {
    background-color: #4285F4;
    color: white;
  }
`;