
import { useEffect, useState } from 'react';
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal"
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import {fetchPost} from '../../utils/utils';

const FeedbackModal = ({handleClose}) => {
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  function sendMessage(message) {
    fetchPost('feedback', {message: message})
    setSent(true);
  } 

  return (
    <Modal
      show={true}
      onHide={handleClose}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Feedback
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>

      { sent ?
        <>
          <h1> Thanks! </h1>
          <div style={{'marginBottom': '10px'}}> If you want to talk to me directly my in game name is Praynr I may be on! </div>
        </>
        :
        <>
          <div style={{'marginBottom': '10px'}}> What can I do take make the website better? </div>
          <InputGroup className="mb-3">
            <InputGroup.Text>Feedback</InputGroup.Text>
            <FormControl as="textarea" aria-label="With textarea" value={feedback} onChange={(e) => setFeedback(e.target.value)}/>
          </InputGroup>
        </>
      }
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        { !sent && <Button disabled={feedback.length === 0} variant="primary" onClick={()=> sendMessage(feedback)}>Send</Button> }
      </Modal.Footer>
    </Modal>
  );
}

export default FeedbackModal;