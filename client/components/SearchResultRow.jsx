import React from 'react';
import styled from 'styled-components';

const getAlbumCover = (track) => {
  const albumImages = track.album.images;
  return albumImages[albumImages.length - 1].url;
}

const getArtists = (track) => {
  let artists = '';
  track.artists.forEach((artist, index) => {
    artists += artist.name;
    if (index !== track.artists.length - 1) {
      artists += ', '
    }
  });
  return artists;
}



const convertDuration = (durationInMs) => {
  const totalSeconds = Math.floor(durationInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;
  if (seconds < 10) seconds = '0' + seconds;
  return `${minutes}:${seconds}`;
}

const SearchResultRow = ({ track, togglePlay, isPlaying, favorites, toggleFavorite, hidePlaylists, getPlaylists }) => {
  const isFavorite = favorites.indexOf(track.id) > -1;

  return (
    <div className="results-row">
      <div className="album-col" onClick={() => togglePlay(track.uri)}>
        {isPlaying ? <div><img src="client/assets/pause.png" /></div> : <div><img src="client/assets/play.png" /></div>}
        <img src={getAlbumCover(track)} className="album-art" />
      </div>
      <div className="track-col">
        <div>{track.name}</div>
        <div>by {getArtists(track)}</div>
      </div>
      <AddPlaylist onClick={(e) => getPlaylists(e, track.uri)} >&#43;</AddPlaylist>
      <div className="duration-col">{convertDuration(track.duration_ms)}</div>
      <div
        className={`like-col ${isFavorite ? "favorite" : ""}`}
        onClick={(e) => { toggleFavorite(track.id, isFavorite) }}
      >
        <svg height="20" viewBox="0 0 48 48" width="20">
          <path></path>
        </svg>
      </div>
    </div>
  );
}

export default SearchResultRow;

// styled components

const AddPlaylist = styled.div`
  text-align: center;
  padding-top: .2rem;
  min-width: 1.5rem;
  min-height: 1.5rem;
  &:hover {
    cursor: pointer;
    border: 1px solid black;
    border-radius: 100%;
  }
`;
