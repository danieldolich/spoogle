import React, { useState, useEffect, Fragment } from 'react';
import './../../styles.css';
import SearchResultRow from './SearchResultRow.jsx';
import SearchBar from './SearchBar.jsx';
import querystring from 'query-string';
import Cookies from 'universal-cookie';
import styled from 'styled-components';

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
      getPlaylists={getPlaylists}
      hidePlaylists={hidePlaylists}
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
        <SearchBar key='searchbar1' submitSearch={submitSearch} />
        <PlaylistDisplay hidden={hidePlaylists}>
          <Form onSubmit={(e) => handlePlaylistSubmit(e)}>
            <UserPlaylists>
              {playlists.map(pl => (
                <Playlists key={pl.name} id={pl.id}>{pl.name}</Playlists>
              ))};
            </UserPlaylists>
              <input type='submit' value='Add to playlist' />
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
  height: 12rem;
  width: 12rem;
  border: 1px solid black;
  background-color: white;
  z-index: 2;
  display: ${props => props.hidden ? 'none' : 'initial'};
`;

//options in the drop down
const Playlists = styled.option`
  
  width: fit-content;
`;

//creates a drop down list
const UserPlaylists = styled.select` 
  width: fit-content;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;