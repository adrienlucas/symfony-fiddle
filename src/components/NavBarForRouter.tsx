import {ReactElement, useCallback, useContext, useRef } from "react";
import {UNSAFE_NavigationContext, useLocation, useNavigate} from "react-router-dom";
import {NavBar} from "@vtaits/react-fake-browser-ui";

type HistoryType = {
  length: number;
  index: number;
};
type NavBarForRouterProps = {
  refresh: () => void;
};

function NavBarForRouter({refresh}: NavBarForRouterProps): ReactElement {
  const { navigator } = useContext(UNSAFE_NavigationContext);

  const history = navigator as unknown as HistoryType;

  const navigate = useNavigate();
  const location = useLocation();

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  const goTo = useCallback((path: string) => {
    console.log('goTo', path)
    navigate(path);
  }, [navigate]);

  const historyIndex = (history as unknown as {
    index: number;
  }).index;

  const addressInput = useRef<HTMLInputElement>(null);
  const navigateTo = useCallback((event: any) => {
    event.preventDefault()
    if(!addressInput.current) return

    const value = addressInput.current.value
    console.log('navigate', value)
    navigate(value)
  }, [addressInput, navigate]);

  // return (<form onSubmit={navigateTo}>
  //   <input ref={addressInput} type={"text"}/>
  // </form>)
  return (
    <NavBar
      canMoveForward={historyIndex < history.length - 1}
      canMoveBack={historyIndex > 0}
      currentAddress={`${location.pathname}${location.search}`}
      refresh={refresh}
      goBack={goBack}
      goForward={goForward}
      goTo={goTo}
    />
  );
}

export default NavBarForRouter