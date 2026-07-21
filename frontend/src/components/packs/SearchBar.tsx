import React, { useState } from 'react';
import { Dropdown, Form } from "react-bootstrap";
import { mockPackMembers } from '../../mockData/mockPacks';
import { type PackMember } from '../../types/Pack';
function SearchBar() {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<PackMember>(
        {
            user_id: -1,
            username: ""
        }
    );
    const [showDropdown, setShowDropdown] = useState(false);

    const filteredPackMembers = mockPackMembers.filter((member)=>{
        return member.username.toLowerCase().includes(search.toLowerCase());
    })
    const selectPackMember = (member: PackMember) => {
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
        {filteredPackMembers.length > 0 ? (
          filteredPackMembers.map((member) => (
            <Dropdown.Item
              key={member.user_id}
              active={member.username === selected.username}
              onClick={() => selectPackMember(member)}
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