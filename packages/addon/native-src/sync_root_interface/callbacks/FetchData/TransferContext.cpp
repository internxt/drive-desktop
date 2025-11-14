#include <TransferContext.h>

struct CfTransferKeyLess
{
    bool operator()(const CF_TRANSFER_KEY &a, const CF_TRANSFER_KEY &b) const
    {
        return a.QuadPart < b.QuadPart;
    }
};

std::map<CF_TRANSFER_KEY, std::shared_ptr<TransferContext>, CfTransferKeyLess> g_transferContextMap;
std::mutex g_contextMapMutex;

std::shared_ptr<TransferContext> CreateTransferContext(CF_TRANSFER_KEY transferKey)
{
    auto ctx = std::make_shared<TransferContext>();
    ctx->transferKey = transferKey;

    std::scoped_lock lock(g_contextMapMutex);
    g_transferContextMap[transferKey] = ctx;
    return ctx;
}

std::shared_ptr<TransferContext> GetTransferContext(CF_TRANSFER_KEY transferKey)
{
    std::scoped_lock lock(g_contextMapMutex);

    if (auto it = g_transferContextMap.find(transferKey); it != g_transferContextMap.end())
    {
        return it->second;
    }

    return nullptr;
}

void RemoveTransferContext(CF_TRANSFER_KEY transferKey)
{
    std::scoped_lock lock(g_contextMapMutex);
    g_transferContextMap.erase(transferKey);
}
