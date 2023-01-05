import {useEffect, useReducer} from "react";
import useFileEditionContext from "../hooks/useFileEditionContext";
import {Paper} from "@mui/material";
import ReactCodeMirror from "@uiw/react-codemirror";
import usePhpContext from "../hooks/usePhpContext";

const fileModificationReducer = (state: {content: string|null}, action: { content: string|null }) => {
  return {content: action.content}
}

const CodeEditor = ({onPendingModifications}: {onPendingModifications: (p: boolean) => void}) => {
  const fileEdition = useFileEditionContext()

  const {writeFile} = usePhpContext()

  const [modifiedContent, dispatchContentModification] = useReducer(fileModificationReducer, { content: null })

  useEffect(() => {
    onPendingModifications(modifiedContent.content !== null)
  }, [onPendingModifications, modifiedContent])

  useEffect(() => {
    const content = modifiedContent.content
    if(!fileEdition || content === null) return

    const writeContent = () => {
      writeFile(fileEdition.fullPath, content)
      dispatchContentModification({content: null})
    }

    const interval = setInterval(writeContent, 750)

    return () => clearInterval(interval)
  }, [writeFile, fileEdition, modifiedContent])

  return (
    <>
        <Paper>
          <ReactCodeMirror
              height="400px" width={"100%"}
              value={fileEdition?.content}
              onChange={(content: string, event: any) => {
                dispatchContentModification({content: content})
              }}
          />
        </Paper>
    </>
      )
}

export default CodeEditor