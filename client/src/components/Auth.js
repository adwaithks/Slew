import React, {useContext, useEffect} from 'react';
import { GoogleLogin } from 'react-google-login';
import { UserContext } from '../context/UserContext';
import {withRouter} from 'react-router-dom';

function Auth(props) {

    const {Gpayload, setGPayload, Guser, setGUser} = useContext(UserContext);

    return (
        <div>
            <GoogleLogin
                clientId="72427653180-11kkrqe0k389kvkr598gcu27fo4b70vg.apps.googleusercontent.com"
                buttonText="Login"
                onSuccess={async (res) => {
                    setGUser(res);
                    const response = await fetch(`http://localhost:5000/auth?tokenId=${res.tokenId}`, {
                        method: 'GET'
                    });
                    if (response.status === 200) {
                        const res = await response.json();
                        setGPayload({
                            name: res.name,
                            email: res.email,
                            imageUrl: res.imageUrl
                        });
                        window.localStorage.setItem('user', res.name)
                        window.localStorage.setItem('imageUrl', res.imageUrl)
                        window.localStorage.setItem('email', res.email);
                        const accessToken = res.accessToken;
                        window.localStorage.setItem('AccessToken', accessToken);
                        props.history.push('/create');
                    }
                }}
                
                onFailure={(res) => {
                console.log('failed');
                console.log(res);
                }}
                cookiePolicy={'single_host_origin'}  
            />
        </div>
    )
}

export default withRouter(Auth);
