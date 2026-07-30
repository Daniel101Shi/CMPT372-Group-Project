import Modal from 'react-bootstrap/Modal';
import { type User } from '../../types/Pack';

type AvailablityModalProps = {
  members: User[];
  date: string;
  setModal: React.Dispatch<React.SetStateAction<ModalData>>
};

interface ModalData{
  members: User[],
  date: string
}


function AvailabilityModal({members, date, setModal} : AvailablityModalProps) {
  return (
    <div
      className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center modal"
      style={{ display: 'block', position: 'initial' }}
    >
      <Modal.Dialog className="m-0 w-25 h-25" size="xl">
        <Modal.Header closeButton onHide={()=>setModal({
            members:[],
            date: ""
          })}>
          <Modal.Title>{date}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>Members: {
          members.length == 0 ? "none" : members.map((member, index)=>{
            if(index != members.length-1)
              return(
                `${member.username} #${member.user_id}, `
              )
            else
              return(
                `${member.username} #${member.user_id}`
              )
          })}</p>
        </Modal.Body>
      </Modal.Dialog>
    </div>
  );
}

export default AvailabilityModal;