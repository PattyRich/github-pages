import { useDrop } from 'react-dnd'
import EditableInput from '../BootStrap/EditableInput'
import { Box } from './Box'

export const Dustbin = (props) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: 'any',
    drop: () => ({ name: props.team.name }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }))
  const isActive = canDrop && isOver
  let backgroundColor = 'white'
  if (isActive) {
    backgroundColor = 'lightblue'
  }
  return (
    <div style={{'backgroundColor': backgroundColor}} ref={drop} className='draft-team' data-testid="dustbin">
      <div className='flex-center' style={{'paddingTop': '10px'}}>
        {props.editMode ?
          <EditableInput change={props.editName} value={props.team.name} width={'auto'} title='' />
          :
          <span>{props.team.name} : ({props.team.members.length})</span>
        }
      </div>
      <hr/>
      <div className='flex-center' style={{'flexWrap': 'wrap'}}>
        {props.team.members.map((player, i)=> {
          return <Box dropped={props.dropped} key={`${i}--${player}`} name={player} />
        }) 
        }
      </div>
  </div>
  )
}

{/* <div ref={drop} style={{ ...style, backgroundColor }} data-testid="dustbin">
{isActive ? 'Release to drop' : 'Drag a box here'}
</div> */}