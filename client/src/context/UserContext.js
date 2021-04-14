import React, { createContext, useState } from 'react';

export const UserContext = createContext();
 
const UserProvider = (props) => {

    const [Guser, setGUser] = useState({});
    const [Gpayload, setGPayload] = useState({});

    return (
        <UserContext.Provider value={{
            Guser,
            setGUser,
            Gpayload,
            setGPayload
        }}>
            {props.children}
        </UserContext.Provider>
    )
}

export default UserProvider;