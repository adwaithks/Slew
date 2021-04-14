import React, {useContext, useEffect} from 'react';
import { GoogleLogin } from 'react-google-login';
import { UserContext } from '../context/UserContext';
import {withRouter} from 'react-router-dom';
import './Auth.css';

function Auth(props) {

    const {Gpayload, setGPayload, Guser, setGUser} = useContext(UserContext);

    useEffect(() => {
        const main = async () => {
            const token = window.localStorage.getItem('AccessToken');
            if (!token) {
                return
            }
            const response = await fetch(`http://localhost:5000/verify`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    token: token
                })
            });

            if (response.status != 200) {
                return
            } else {
                const res = await response.json();
                setGPayload(res);
                props.history.push('/create');
            }
        }
        main();
    }, []);



    return (
        <div className="Auth">
            <GoogleLogin
                className="googleLogin-auth"
                clientId={process.env.CLIENT_ID}
                buttonText="Login"
                onSuccess={async (res) => {
                    setGUser(res);
                    const response = await fetch(`http://localhost:5000/auth`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            tokenId: res.tokenId
                        })
                    });

                    if (response.status == 200) {
                        try {
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
                        } catch (error) {
                            console.log('errorrrrr');
                            console.log(error);
                        }
                        
                        
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
