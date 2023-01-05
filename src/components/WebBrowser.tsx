import ResponseContainer from "./ResponseContainer";
import {useCallback, useState} from "react";
import {NavBar} from "@vtaits/react-fake-browser-ui";
import usePhpContext from "../hooks/usePhpContext";

const createPhpRequest = (method: string, uri: string, contentType: string, accept: string, body: string) => {
  //'CONTENT_TYPE' => '${contentType}',
  return `Symfony\\Component\\HttpFoundation\\Request::create('${uri}', '${method}', [], [], [], [
    'HTTP_ACCEPT' => '${accept}'
  ], ${method === 'GET' ? 'null' : `'${body}'`})`
}

const WebBrowser = () => {

  const [uri, setUri] = useState('')
  const { runCode } = usePhpContext()

  const runKernelQuery = useCallback((uri: string): number|null => {
    setUri(uri)
    const code = `
      global $_SERVER;
      $_SERVER['PHP_SELF'] = 'index.php';

      require '/src/api-platform/vendor/autoload.php';
      (new \\Symfony\\Component\\Dotenv\\Dotenv())->bootEnv('/src/api-platform/.env');
      $kernel = new \\App\\Kernel('dev', false);
      $request = ${createPhpRequest('GET', uri, 'application/json', 'application/html', '')};
      $response = $kernel->handle($request);
      // return $response->getContent();
      $response->send();
      $kernel->terminate($request, $response);
    `

    // const code = `return 'Hello World';`
    console.log('runKernelQuery', code)
    const response = runCode(code)
    console.log('response', response)
    return response
  }, [setUri, runCode])

  return (
    <>
      <NavBar
        canMoveForward={false}
        canMoveBack={false}
        currentAddress={uri}
        refresh={() => null}
        goBack={() => null}
        goForward={() => null}
        goTo={runKernelQuery}
      />
      <ResponseContainer key={10001} />
    </>
  )
}

// const _WebBrowser = () => {
//
//   const [uniq, setUniq] = useState(1001);
//
//
//   const runPhp = usePhpRun()
//   const runKernelQuery = useCallback((routerObject: LoaderFunctionArgs): number|undefined => {
//     const {params} = routerObject
//     const uri = '/'+params['*']
//
//   // useEffect(() => {
//   //   if(!runPhp || !currentUrl) return
//     if(!runPhp || !uri) return
//     // const code = `
//     //
//     // global $_SERVER;
//     // $_SERVER['PHP_SELF'] = 'index.php';
//     //
//     // require '/src/api-platform/vendor/autoload.php';
//     // (new \\Symfony\\Component\\Dotenv\\Dotenv())->bootEnv('/src/api-platform/.env');
//     //
//     // $runtime = new \\Symfony\\Component\\Runtime\\SymfonyRuntime(['project_dir' => '/src/api-platform']);
//     //
//     // [$app, $args] = $runtime
//     //     ->getResolver(function (array $context) {
//     //         return new \\App\\Kernel('dev', false);
//     //     })
//     //     ->resolve();
//     // $app = $app(...$args);
//     //
//     // exit(
//     //     $runtime
//     //         ->getRunner($app)
//     //         ->run()
//     // );
//     // `
//     const code = `
//       global $_SERVER;
//       $_SERVER['PHP_SELF'] = 'index.php';
//
//       require '/src/api-platform/vendor/autoload.php';
//       (new \\Symfony\\Component\\Dotenv\\Dotenv())->bootEnv('/src/api-platform/.env');
//       $kernel = new \\App\\Kernel('dev', false);
//       $request = ${createPhpRequest('GET', uri, 'application/json', 'application/html', '')};
//       $response = $kernel->handle($request);
//       // return $response->getContent();
//       $response->send();
//       $kernel->terminate($request, $response);
//     `
//
//     // const code = `return 'Hello World';`
//     console.log('runKernelQuery', code)
//     const response = runPhp(code)
//     console.log('response', response)
//     return response
//   }, [runPhp])
//
//   const fakeRouter = createMemoryRouter([
//     {
//       path: "*",
//       element: (<>
//         {/*<NavBarForRouter refresh={() => setUniq((prev) => prev + 1)} />*/}
//         <NavBarForRouter refresh={() => null} />
//         <ResponseContainer key={10001} />
//       </>),
//       loader: runKernelQuery
//       // loader: ({ params }): Promise<string> => {
//       //   runKernelQuery('/'+params['*'])
//       //   return new Promise(()=> {return ''})
//       // }
//     }
//   ], {
//     initialEntries: ["/"],
//   })
//
//   return (
//     <RouterProvider router={fakeRouter} />
//   )
// }

export default WebBrowser