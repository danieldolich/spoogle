import React from 'react';
import ReactDOM from 'react-dom';


function CachedResults(props) {
  const getAlbumCover = (track) => {
    const albumImages = track.album.images;
    return albumImages[albumImages.length - 1].url;
  } 

console.log('data passed into Cached Result', props.index)
    return (
        <img display="inline-block" src={getAlbumCover(props.data[0])} width="50px" className="imageStories" onClick={() => props.clickedPopover(props.data)} ></img>
    );
  }



export default CachedResults;