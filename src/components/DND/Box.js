import { useDrag } from 'react-dnd'
import Button from '../BootStrap/Button'

const style = {
  border: '1px dashed gray',
  backgroundColor: 'white',
  padding: '0.5rem 1rem',
  marginRight: '1.5rem',
  marginBottom: '1.5rem',
  cursor: 'move',
  display: 'flex'
}
export const Box = function Box({ name, dropped, notPlaced }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'any',
    item: { name },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult()
      if (item && dropResult) {
        dropped(item.name, dropResult.name)
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }))
  const opacity = isDragging ? 0.4 : 1
  return (
    <span style={{'position': 'relative'}}>
      {!(notPlaced) && 
        <span onClick={() => dropped(name, 'jsadifoghdsal;kfgdjs;')} style={{'color': 'red', 'cursor': 'pointer', 'fontSize': 10, 'position': 'absolute', 'right': '27px'}}>x</span>
      }
      <div ref={drag} style={{ ...style, opacity }} data-testid={`box`}>
        {name}
      </div>
    </span>
  )
}
