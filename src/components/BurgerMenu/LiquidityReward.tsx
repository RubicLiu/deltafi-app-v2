import { Box, IconButton } from "@mui/material";
import { ReactElement } from "react";
import { useModal } from "providers/modal";
import CloseIcon from "@mui/icons-material/Close";
import { PoolConfig, poolConfigs } from "constants/deployConfigV2";
import RewardCard from "views/Reward/components/RewardCard";

const LiquidityReward = (): ReactElement => {
  const { setMenu } = useModal();
  return (
    <Box width="100%" minWidth={{ md: 460 }}>
      <Box display="flex" justifyContent="space-between">
        <Box color="#F6F6F6" fontSize={20} fontWeight={500}>
          Liquidity Mining
        </Box>
        <IconButton size="small" onClick={() => setMenu(false, "")}>
          <CloseIcon sx={{ color: "#F6F6F6" }} />
        </IconButton>
      </Box>
      <Box maxHeight={500} sx={{ overflow: "auto" }}>
        {poolConfigs.map((poolConfig: PoolConfig) => (
          <RewardCard key={poolConfig.name + "-reward"} poolConfig={poolConfig} />
        ))}
      </Box>
    </Box>
  );
};

export default LiquidityReward;
