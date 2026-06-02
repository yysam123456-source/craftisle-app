import { CaretDownIcon } from '@radix-ui/react-icons'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

type Props = {
  children: React.ReactNode
  buttonProps?: React.ComponentProps<typeof Button>
}

export const ButtonDropdownItem = DropdownMenuItem

export function ButtonDropdown(props: Props) {
  const { buttonProps, children } = props
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" {...buttonProps}>
          <CaretDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {children}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
