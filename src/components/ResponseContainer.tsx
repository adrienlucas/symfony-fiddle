import Iframe from "react-iframe";
import usePhpContext from "../hooks/usePhpContext";

function ResponseContainer() {
  // const response = useLoaderData() as string|undefined

  const {stdout} = usePhpContext()

  return (<Iframe
    url={""} // mandatory but useless
    src={`data:text/html;charset=utf-8,${encodeURIComponent(stdout)}`}
    width={'100%'} height={'80%'}
    styles={{border: '2px solid #f6f6f6'}}
  />)
}

export default ResponseContainer