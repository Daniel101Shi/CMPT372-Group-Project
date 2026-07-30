import React from 'react';
import { Dropdown, Form } from "react-bootstrap";
import { type Friend} from '../../types/Pack';

type SearchBarProps = {
    search: string,
    setSelected: React.Dispatch<React.SetStateAction<Friend>>,
    setSearch: React.Dispatch<React.SetStateAction<string>>,
    setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>,
    searchDropdown: Friend[],
    showDropdown: boolean,
    selected: Friend
};
function SearchBar({search, selected, setSelected, setSearch, setShowDropdown, showDropdown, searchDropdown} : SearchBarProps) {
    const filteredFriends = searchDropdown.filter((member)=>{
        return member.username.toLowerCase().includes(search.toLowerCase());
    })
    const selectFriend = (member: Friend) => {
        setSelected(member);
        setSearch(member.username);
        setShowDropdown(false);
      };

  return (
   <Dropdown
    show={showDropdown}
    onToggle={(show) => setShowDropdown(show)}
   >
    <Dropdown.Toggle
        as="div"
        className="search-dropdown-toggle"
    >
        <Form.Control
            type="text"
            placeholder="Find friend..."
            value={search}
            onChange={(event) => {
                setSearch(event.target.value);
                setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
        />
    </Dropdown.Toggle>

    <Dropdown.Menu className="w-100">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((member) => (
            <Dropdown.Item
              key={member.user_id}
              active={member.username === selected.username}
              onClick={() => selectFriend(member)}
            >
              {member.username} #{member.user_id}
            </Dropdown.Item>
          ))
        ) : (
          <Dropdown.Item disabled>No friends found</Dropdown.Item>
        )}
      </Dropdown.Menu>

   </Dropdown>
  );
}

export default SearchBar;