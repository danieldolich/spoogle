import React from 'react';
import ReactDOM from 'react-dom';
import { makeStyles, withTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';



const useStyles = makeStyles({
  root: {
    width: 300,
  },
});

function valuetext(value) {
  return `${value}°C`;
}

function Filters(props) {
  const classes = useStyles();
  // this is strictly updating the css rendering so that the red 
  // this is a React Hook
  // on the first ever render, value equals the props..min and props max
  // the setValue here is the function that can be invoked down on line 29, and its used
  // in case we want to change "value's" values
  const [value, setValue] = React.useState([props.parameterObj.min, props.parameterObj.max]);
  // setvalue is invoked when we change the slider from lets say 100 to 77
  const handleChange = (event, newValue) => {
    props.onChangeFunc(props.id, newValue)
    setValue(newValue);
  };
  // setValue only affects the stuff on this page (aka the rendering of the sliders)
  // and the props.onchangefunc we pass "up" the actual under the hood value changes back up to searchbar
  const handleReset = () => {
    let max = props.parameterObj.max;
    let min = props.parameterObj.min;
    // grabbing the hard coded defaul min/max values
    let newValue = [min, max];
    console.log(newValue)
    props.onChangeFunc(props.id, newValue)
    setValue(newValue);
  };
  


  return (
    <div className="sliding">
      <Typography id="range-slider" className="tooltip" gutterBottom>
        {props.parameterObj.displayName}
        <span className="tooltiptext">{props.parameterObj.description}</span>
      </Typography>
      <img src="client/assets/reset.png" width='19px' alt="RESET" onClick={handleReset}/>
      <Slider
        color="secondary"
        value={value}
        onChange={handleChange}
        valueLabelDisplay="auto"
        aria-labelledby="range-slider"
        getAriaValueText={valuetext}
        min={props.parameterObj.min}
        max={props.parameterObj.max}
      />
    </div>
  );
}


export default Filters;
